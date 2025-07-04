import { v2 as cloudinary } from 'cloudinary';
import { Op, Sequelize } from 'sequelize';
//models
import Photo from '../models/Photo.js';
import Users from '../models/Users.js';
import Stores from '../models/Stores.js';
import Products from '../models/Products.js';
import Categories from '../models/Categories.js';
import ProductCategories from '../models/ProductCategories.js';
import StoreAdmin from '../models/StoreAdmin.js';
import Discounts from '../models/Discounts.js';
import ReviewReplies from '../models/ReviewReplies.js';
import Reviews from '../models/Reviews.js';
import Payments from '../models/Payments.js';
// utils
import updateImages from '../utils/updateImages.js';
import notification from '../socket/notificationService.js';

const calculatePagination = (page, limit, total) => {
	const maxPageCount = Math.ceil(total / limit);
	const offset = (page - 1) * limit;
	return { maxPageCount, offset };
};

export default {
	getCategories: async (req, res) => {
		try {
			const categories = await Categories.findAll({
				attributes: ['id', 'name'],
				include: [
					{
						model: Photo,
						as: 'categoryImage',
						attributes: ['id', 'path'],
					},
				],
				order: [['name', 'ASC']],
			});
			res.status(200).json({
				categories,
				message: 'Categories fetched successfully',
			});
		} catch (error) {
			console.log(error);
			res.status(500).json({
				message: 'Error fetching categories',
			});
		}
	},

	createProduct: async (req, res) => {
		try {
			const { files = [] } = req;
			const { categoryId } = req.params;
			const { name, size, price, description, brandName, quantity } = req.body;
			const { id } = req.user;

			const user = await Users.findByPk(id);
			if (user.role !== 'admin') {
				return res.status(401).json({
					message: 'You are not authorized to create a product',
				});
			}

			const store = await StoreAdmin.findOne({
				where: { userId: user.id },
			});
			if (!store) {
				return res.status(404).json({
					message: 'Store not found',
				});
			}

			const categoryRecord = await Categories.findOne({
				where: { id: categoryId },
			});

			if (!categoryRecord) {
				return res.status(404).json({
					message: 'Category not found',
				});
			}

			const productCreate = await Products.create({
				name,
				size,
				price,
				description,
				brandName,
				quantity,
				storeId: store.storeId,
			});

			await ProductCategories.create({
				productId: productCreate.id,
				categoryId: categoryRecord.id,
				storeId: store.storeId,
			});

			if (!productCreate) {
				if (files) {
					await cloudinary.uploader.destroy(files.filename);
				}
				return res.status(500).json({
					message: 'Error creating product',
				});
			}

			if (files.length > 0) {
				for (const file of files) {
					await Photo.create({
						productId: productCreate.id,
						path: file.path,
					});
				}
			}

			const product = await Products.findByPk(productCreate.id, {
				include: [
					{
						model: Photo,
						as: 'productImage',
						attributes: ['path'],
					},
				],
			});

			res.status(201).json({
				product,
				message: 'Product created successfully',
			});
		} catch (error) {
			console.log(error);
			res.status(500).json({
				message: 'Error creating product',
			});
		}
	},

	getProducts: async (req, res) => {
		try {
			const { categoryId } = req.params;
			const { id } = req.user;
			const { limit = 10, page = 1 } = req.query;
			const { minPrice = 0, maxPrice = 1000000 } = req.query;

			const store = await StoreAdmin.findOne({ where: { userId: id } });

			if (!store) {
				res.status(404).json({
					message: 'Store not found',
				});
				return;
			}

			const total = await ProductCategories.count({
				where: { categoryId, storeId: store.storeId },
			});

			const { maxPageCount, offset } = calculatePagination(page, limit, total);

			if (page > maxPageCount) {
				res.status(404).json({ message: 'Page not found' });
				return;
			}

			if (!categoryId) {
				res.status(400).json({
					message: 'Category ID is required',
				});
				return;
			}

			const products = await ProductCategories.findAll({
				where: { categoryId },
				attributes: ['productId', 'categoryId'],
				include: [
					{
						model: Products,
						where: {
							price: {
								[Op.gte]: minPrice,
								[Op.lte]: maxPrice,
							},
						},
						include: [
							{
								model: Discounts,
								as: 'discount',
								attributes: [
									'discountPercentage',
									'discountPrice',
									'startDate',
									'endDate',
								],
							},
							{
								model: Stores,
								attributes: ['name'],
								where: { id: store.storeId },
							},
							{
								model: Photo,
								as: 'productImage',
								attributes: ['path', 'id'],
							},
						],
					},
				],
				order: [['id', 'DESC']],
				limit: +limit,
				offset,
			});

			if (!products.length === 0) {
				res.status(404).json({
					message: 'Products not found',
				});
				return;
			}

			const filteredProducts = products
				.map(item => {
					if (item.product !== null) {
						return {
							productId: item.productId,
							categoryId: item.categoryId,
							product: item.product,
						};
					}
					return null;
				})
				.filter(item => item !== null);

			res.status(200).json({
				products: filteredProducts,
				total,
				currentPage: page,
				maxPageCount,
				message: 'Products fetched successfully',
			});
		} catch (error) {
			console.log(error);
			res.status(500).json({
				message: 'Error fetching products',
			});
		}
	},

	getProductById: async (req, res) => {
		try {
			const { productId } = req.params;
			const { id } = req.user;

			if (!productId) {
				res.status(400).json({ message: 'Product id is required' });
				return;
			}

			const store = await StoreAdmin.findOne({ where: { userId: id } });

			const product = await Products.findOne({
				where: { id: productId },
				include: [
					{
						model: Photo,
						as: 'productImage',
						attributes: ['id', 'path'],
					},
					{
						model: Discounts,
						as: 'discount',
						attributes: [
							'discountPercentage',
							'discountPrice',
							'startDate',
							'endDate',
						],
					},
					{
						model: Stores,
						as: 'store',
						where: { id: store.storeId },
						attributes: ['name'],
					},
				],
			});

			if (!product) {
				res.status(404).json({
					message: 'Product not found',
				});
				return;
			}

			const result = {
				product: {
					id: product.id,
					name: product.name,
					description: product.description,
					price: product.price,
					size: product.size,
					quantity: product.quantity,
					brandName: product.brandName,
					images: product.productImage
						? product.productImage.map(image => ({
								id: image.id,
								url: image.path,
						  }))
						: [],
					discount: product.discount
						? {
								discountPercentage: product.discount.discountPercentage,
								discountPrice: product.discount.discountPrice,
								startDate: product.discount.startDate,
								endDate: product.discount.endDate,
						  }
						: null,
					store: product.store
						? {
								id: product.store.id,
								name: product.store.name,
						  }
						: null,
				},
			};

			res.status(200).json({
				result,
				message: 'Product fetched successfully',
			});
		} catch (error) {
			console.log(error);
			res.status(500).json({
				message: 'Error fetching product',
			});
		}
	},

	getAllProducts: async (req, res) => {
		try {
			const { id } = req.user;
			const { limit = 10, page = 1 } = req.query;
			const { minPrice = 0, maxPrice = 1000000 } = req.query;

			const store = await StoreAdmin.findOne({ where: { userId: id } });

			if (!store) {
				res.status(404).json({
					message: 'Store not found',
				});
				return;
			}

			const total = await Products.count({
				where: {
					storeId: store.storeId,
					price: {
						[Op.gte]: +minPrice,
						[Op.lte]: +maxPrice,
					},
				},
			});

			const { maxPageCount, offset } = calculatePagination(page, limit, total);

			if (page > maxPageCount) {
				res.status(404).json({ message: 'Page not found' });
				return;
			}

			const user = await Users.findByPk(id);
			if (user.role !== 'admin') {
				return res.status(401).json({
					message: 'You are not authorized to get all products',
				});
			}

			const products = await Products.findAll({
				where: {
					price: {
						[Op.gte]: +minPrice,
						[Op.lte]: +maxPrice,
					},
				},
				include: [
					{
						model: Photo,
						as: 'productImage',
						attributes: ['path', 'id'],
					},
					{
						model: Discounts,
						as: 'discount',
						attributes: [
							'discountPercentage',
							'discountPrice',
							'startDate',
							'endDate',
						],
					},
					{
						model: Stores,
						attributes: ['name'],
						where: { id: store.storeId },
					},
				],
				limit: +limit,
				offset,
				order: [['id', 'DESC']],
			});
			if (!products) {
				res.status(404).json({
					message: 'Products not found',
				});
				return;
			}

			res.status(200).json({
				products,
				total,
				currentPage: page,
				maxPageCount,
				message: 'Products fetched successfully',
			});
		} catch (error) {
			console.log(error);
			res.status(500).json({
				message: 'Error fetching products',
			});
		}
	},

	updateProduct: async (req, res) => {
		try {
			const { productId } = req.params;
			const {
				name,
				size,
				price,
				description,
				brandName,
				quantity,
				imageId = null,
			} = req.body;
			const { id } = req.user;
			const files = req.files || [];

			const product = await Products.findOne({
				where: { id: Number(productId) },
				include: [
					{ model: Photo, as: 'productImage', attributes: ['path', 'id'] },
				],
			});

			if (!product) {
				return res.status(404).json({ message: 'Product not found' });
			}

			const user = await Users.findByPk(id);
			if (!user || user.role !== 'admin') {
				return res
					.status(403)
					.json({ message: 'You are not authorized to update this product' });
			}

			if (files.length && !imageId) {
				await Promise.all(
					files.map(file =>
						Photo.create({ path: file.path, productId: product.id })
					)
				);
			}

			let imageUpdateResult = null;
			if (imageId && files.length) {
				imageUpdateResult = await updateImages('Product', files, imageId);
			}

			await product.update({
				name,
				size,
				quantity,
				price,
				description,
				brandName,
			});

			let response = { product, message: 'Product updated successfully' };
			if (imageUpdateResult && !imageUpdateResult.success) {
				response.imageMessage = imageUpdateResult.message;
			}

			return res.status(200).json(response);
		} catch (error) {
			console.error(error);
			return res.status(500).json({ message: 'Error updating product' });
		}
	},

	deleteProduct: async (req, res) => {
		try {
			const { productId } = req.params;
			const { id } = req.user;

			const user = await Users.findByPk(id);
			if (user.role !== 'admin') {
				return res.status(401).json({
					message: 'You are not authorized to update this product',
				});
			}
			const store = await StoreAdmin.findOne({ where: { userId: user.id } });
			if (!store) {
				return res.status(404).json({
					message: 'Store not found',
				});
			}

			const product = await Products.findOne({ where: { id: productId } });

			if (!product) {
				return res.status(404).json({
					message: 'Product not found',
				});
			}

			await ProductCategories.destroy({ where: { productId: product.id } });
			await Products.destroy({ where: { id: product.id } });

			res.status(200).json({
				message: 'Product deleted successfully',
			});
		} catch (error) {
			console.log(error);
			res.status(500).json({
				message: 'Error deleting product',
			});
		}
	},

	searchStoreProduct: async (req, res) => {
		try {
			const { id } = req.user;

			const {
				search = '',
				minPrice = 0,
				maxPrice = Number.MAX_VALUE,
				limit = 10,
				page = 1,
				categoryIds,
			} = req.query;

			const user = await StoreAdmin.findOne({ where: { userId: id } });

			if (!user) {
				res.status(404).json({ message: 'Store not found for this user' });
				return;
			}

			const categoryArray = categoryIds
				? categoryIds
						.split(',')
						.map(id => parseInt(id, 10))
						.filter(id => !isNaN(id))
				: [];

			const total = await Products.count({
				where: {
					storeId: user.storeId,
					name: {
						[Op.like]: `%${search}%`,
					},
					price: {
						[Op.between]: [minPrice, maxPrice],
					},
				},
				include: categoryArray.length
					? [
							{
								model: ProductCategories,
								as: 'categories',
								where: {
									categoryId: { [Op.in]: categoryArray },
									storeId: user.storeId,
								},
								required: true,
							},
					  ]
					: [],
			});

			const { maxPageCount, offset } = calculatePagination(page, limit, total);

			if (page > maxPageCount) {
				res.status(404).json({ message: 'Page not found' });
				return;
			}

			const products = await Products.findAll({
				where: {
					storeId: user.storeId,
					name: {
						[Op.like]: `%${search}%`,
					},
					price: {
						[Op.between]: [minPrice, maxPrice],
					},
				},
				include: [
					{
						model: Photo,
						as: 'productImage',
						attributes: ['path', 'id'],
					},
					{
						model: Stores,
						attributes: ['name'],
						where: { id: user.storeId },
					},
					{
						model: ProductCategories,
						as: 'categories',
						required: categoryArray.length > 0,
						where: categoryArray.length
							? {
									categoryId: { [Op.in]: categoryArray },
									storeId: user.storeId,
							  }
							: undefined,
						attributes: ['categoryId'],
					},
				],
				limit: +limit,
				offset,
				order: [['id', 'DESC']],
			});

			if (products.length === 0) {
				res.status(404).json({
					message: 'No products found',
				});
				return;
			}

			res.status(200).json({
				products,
				total,
				currentPage: page,
				maxPageCount,
				message: 'Products fetched successfully',
			});
		} catch (error) {
			console.log(error);
			res.status(500).json({
				message: 'Error fetching products',
			});
		}
	},

	discount: async (req, res) => {
		try {
			const { productId, discountPercentage, startDate, endDate } = req.body;
			const { id } = req.user;

			const store = await StoreAdmin.findOne({ where: { userId: id } });
			if (!store) {
				return res.status(404).json({ message: 'Store not found' });
			}

			const product = await Products.findByPk(productId);
			if (!product) {
				return res.status(404).json({ message: 'Product not found' });
			}

			const discountPrice = (product.price * (100 - discountPercentage)) / 100;

			const existingDiscount = await Discounts.findOne({
				where: { productId },
			});

			if (existingDiscount) {
				await existingDiscount.update({
					storeId: store.storeId,
					discountPercentage,
					discountPrice,
					startDate: startDate || existingDiscount.startDate,
					endDate: endDate || existingDiscount.endDate,
				});

				return res.json({
					message: 'Discount updated',
					discount: existingDiscount,
				});
			}

			const newDiscount = await Discounts.create({
				storeId: store.storeId,
				productId,
				discountPercentage,
				discountPrice,
				startDate: startDate || new Date(),
				endDate:
					endDate || new Date(new Date().setDate(new Date().getDate() + 7)),
			});

			return res.json({ message: 'Discount created', discount: newDiscount });
		} catch (error) {
			console.error(error);
			return res.status(500).json({ message });
		}
	},

	delateImage: async (req, res) => {
		try {
			const { imageId } = req.params;
			const { id } = req.user;

			const user = await Users.findByPk(id);
			if (user.role !== 'admin') {
				return res.status(401).json({
					message: 'You are not authorized to update this product',
				});
			}
			const store = await StoreAdmin.findOne({ where: { userId: user.id } });
			if (!store) {
				return res.status(404).json({
					message: 'Store not found',
				});
			}

			const image = await Photo.findOne({ where: { id: imageId } });

			if (!image) {
				return res.status(404).json({
					message: 'Image not found',
				});
			}

			const fileName = `Product/${image.path
				.split('/')
				.pop()
				.split('.')
				.slice(0, -1)
				.join('.')}`;

			await cloudinary.uploader.destroy(fileName);

			await Photo.destroy({ where: { id: imageId } });

			res.status(200).json({
				message: 'Image deleted successfully',
			});
		} catch (error) {
			console.log(error);
			res.status(500).json({
				message: 'Error deleting image',
			});
		}
	},

	createReply: async (req, res) => {
		try {
			const { reviewId, reply } = req.body;
			const sellerId = req.user.id;

			const review = await Reviews.findByPk(reviewId);
			if (!review) {
				return res.status(404).json({ message: 'Review not found' });
			}

			const seller = await Users.findByPk(sellerId);
			if (!seller || seller.role !== 'admin') {
				return res.status(403).json({ message: 'You are not an admin' });
			}

			const newReply = await ReviewReplies.create({
				reviewId,
				sellerId,
				reply,
			});

			const product = await Products.findOne({
				where: { id: review.productId },
				include: [
					{
						model: Photo,
						as: 'productImage',
						attributes: ['path'],
					},
				],
			});

			if (!product) {
				return res.status(404).json({ message: 'Product not found' });
			}

			const productData = {
				id: product.id,
				name: product.name,
				path: product.productImage?.[0]?.path || null,
			};

			notification.sendReviewReplyNotification(
				review.userId,
				reply,
				seller,
				productData
			);

			res.status(201).json(newReply);
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	},

	getStatistics: async (req, res) => {
		try {
			const { startDate, endDate, groupBy = 'day' } = req.query;
			const { id } = req.user;

			const user = await Users.findByPk(id);
			if (!user || user.role !== 'admin') {
				return res.status(401).json({
					message: 'You are not authorized to view statistics',
				});
			}

			const storeAdmin = await StoreAdmin.findOne({ where: { userId: id } });
			if (!storeAdmin) {
				return res.status(404).json({
					message: 'No store found for this admin',
				});
			}

			const storeId = storeAdmin.storeId;

			const product = await Products.count({
				where: { storeId },
			});

			let start, end;
			if (!startDate || !endDate) {
				const now = new Date();
				start = new Date(now.getFullYear(), now.getMonth(), 1);
				end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
			} else {
				start = new Date(startDate);
				end = new Date(endDate);
			}

			if (isNaN(start.getTime()) || isNaN(end.getTime())) {
				return res.status(400).json({
					message: 'Invalid date format. Please use YYYY-MM-DD',
				});
			}

			let groupInterval;
			switch (groupBy) {
				case 'year':
					groupInterval = Sequelize.literal(
						"DATE_FORMAT(createdAt, '%Y-01-01')"
					);
					break;
				case 'month':
					groupInterval = Sequelize.literal(
						"DATE_FORMAT(createdAt, '%Y-%m-01')"
					);
					break;
				case 'day':
				default:
					groupInterval = Sequelize.literal(
						"DATE_FORMAT(createdAt, '%Y-%m-%d')"
					);
					break;
			}

			const salesStatistics = await Payments.findAll({
				attributes: [
					[groupInterval, 'interval'],
					[Sequelize.fn('SUM', Sequelize.col('amount')), 'totalRevenue'],
					[Sequelize.fn('COUNT', Sequelize.col('id')), 'totalSales'],
				],
				where: {
					storeId,
					createdAt: {
						[Op.between]: [start, end],
					},
				},
				group: ['interval'],
				order: [groupInterval],
			});

			if (!salesStatistics.length) {
				return res.status(200).json({
					storeId,
					totalRevenue: 0,
					totalSales: 0,
					totalOrders: 0,
					statistics: [],
					message: 'No sales statistics found for this store and period',
				});
			}

			const totalRevenue = await Payments.sum('amount', {
				where: {
					storeId,
				},
			});

			const totalSales = await Payments.sum('amount', {
				where: {
					storeId,
					createdAt: {
						[Op.between]: [start, end],
					},
				},
			});

			const totalOrders = await Payments.count({
				where: {
					storeId,
					createdAt: {
						[Op.between]: [start, end],
					},
				},
				distinct: true,
				col: 'id',
			});

			const statistics = salesStatistics.map(stat => ({
				interval: stat.dataValues.interval,
				totalRevenue: parseFloat(stat.dataValues.totalRevenue),
				totalSales: parseInt(stat.dataValues.totalSales, 10),
			}));

			res.status(200).json({
				storeId,
				totalRevenue: totalRevenue || 0,
				totalSales: totalSales || 0,
				totalOrders: totalOrders || 0,
				productsCount: product || 0,
				statistics,
				message: 'Sales statistics for the store fetched successfully',
			});
		} catch (error) {
			console.error('Error fetching sales statistics:', error);
			res.status(500).json({
				message: 'Error fetching sales statistics',
			});
		}
	},

	getBuyers: async (req, res) => {
		try {
			const { startDate, endDate } = req.query;
			const { id } = req.user;

			const user = await Users.findByPk(id);
			if (!user || user.role !== 'admin') {
				return res.status(401).json({
					message: 'You are not authorized to view buyers',
				});
			}

			const storeAdmin = await StoreAdmin.findOne({ where: { userId: id } });
			if (!storeAdmin) {
				return res.status(404).json({
					message: 'No store found for this admin',
				});
			}

			const storeId = storeAdmin.storeId;

			let start = startDate
				? new Date(startDate)
				: new Date(new Date().getFullYear(), new Date().getMonth(), 1);
			let end = endDate
				? new Date(endDate)
				: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

			if (isNaN(start.getTime()) || isNaN(end.getTime())) {
				return res.status(400).json({
					message: 'Invalid date format. Please use YYYY-MM-DD',
				});
			}

			const buyersData = await Payments.findAll({
				attributes: [
					'userId',
					[Sequelize.fn('SUM', Sequelize.col('amount')), 'totalSpent'],
					[Sequelize.fn('SUM', Sequelize.col('quantity')), 'totalQuantity'],
				],
				where: {
					storeId,
					createdAt: { [Op.between]: [start, end] },
				},
				group: ['userId'],
				raw: true,
			});

			if (!buyersData.length) {
				return res.status(200).json({
					storeId,
					buyers: [],
					message: 'No buyers found for this store and period',
				});
			}

			const userIds = buyersData.map(u => u.userId);
			const users = await Users.findAll({
				attributes: ['id', 'email'],
				where: { id: userIds },
				include: {
					model: Photo,
					as: 'avatar',
					attributes: ['path'],
				},
				raw: true,
			});

			const buyers = users.map(user => {
				const buyerData = buyersData.find(b => b.userId === user.id);
				return {
					id: user.id,
					email: user.email,
					avatar: user['avatar.path'] ? user['avatar.path'] : null,
					totalSpent: buyerData ? parseFloat(buyerData.totalSpent) : 0,
					totalQuantity: buyerData ? parseInt(buyerData.totalQuantity) : 0,
				};
			});

			res.status(200).json({
				storeId,
				buyers,
				message: 'Buyers fetched successfully',
			});
		} catch (error) {
			console.error('Error fetching buyers for the store:', error);
			res.status(500).json({
				message: 'Error fetching buyers for the store',
			});
		}
	},
};
