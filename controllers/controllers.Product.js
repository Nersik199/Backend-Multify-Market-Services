import Products from '../models/Products.js';
import ProductCategories from '../models/ProductCategories.js';
import Photo from '../models/Photo.js';
import Stores from '../models/Stores.js';
import Payments from '../models/Payments.js';
import Categories from '../models/Categories.js';
import Discounts from '../models/Discounts.js';
import Cards from '../models/Cards.js';
import { Op, Sequelize } from 'sequelize';

const calculatePagination = (page, limit, total) => {
	const maxPageCount = Math.ceil(total / limit);
	const offset = (page - 1) * limit;
	return { maxPageCount, offset };
};

const handleErrorResponse = (res, status, message, error = null) => {
	console.error(message, error);
	return res.status(status).json({ message, error: error?.message });
};

export default {
	async getStores(req, res) {
		try {
			const total = await Stores.count();
			const { page = 1, limit = 10 } = req.query;

			const { maxPageCount, offset } = calculatePagination(page, limit, total);

			if (page > maxPageCount) {
				return res.status(404).json({ message: 'Product does not exist' });
			}

			const stores = await Stores.findAll({
				include: [
					{
						model: Photo,
						as: 'storeLogo',
						attributes: ['path'],
					},
				],
			});
			res.status(200).json({
				stores,
				message: 'Stores fetched successfully',
			});

			if (!stores) {
				return res.status(404).json({ message: 'No stores found' });
			}
		} catch (error) {
			return handleErrorResponse(res, 500, 'Error fetching products', error);
		}
	},

	async getStoreById(req, res) {
		try {
			const { id } = req.params;
			if (!id) {
				return res.status(400).json({ message: 'Store id is required' });
			}
			const store = await Stores.findOne({
				where: { id },
				include: [
					{
						model: Photo,
						as: 'storeLogo',
						attributes: ['path'],
					},
				],
			});
			if (!store) {
				return res.status(404).json({ message: 'Store not found' });
			}
			return res.status(200).json({
				store,
				message: 'Store fetched successfully',
			});
		} catch (error) {
			return handleErrorResponse(res, 500, 'Error fetching store', error);
		}
	},

	async getProductById(req, res) {
		try {
			const { id } = req.params;
			const userId = req.user?.id;
			if (!id) {
				return res.status(400).json({ message: 'Product id is required' });
			}

			const product = await Products.findOne({
				where: { id },
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
						attributes: ['name'],
						include: [
							{
								model: Photo,
								as: 'storeLogo',
								attributes: ['id', 'path'],
							},
						],
					},
				],
			});

			if (!product) {
				return res.status(404).json({ message: 'Product not found' });
			}

			let isInCart = null;
			if (userId) {
				const cartItem = await Cards.findOne({
					where: { userId, productId: id },
					attributes: ['id', 'quantity'],
				});

				if (cartItem) {
					isInCart = {
						cartId: cartItem.id,
						quantity: cartItem.quantity,
					};
				}
			}

			const result = {
				product: {
					id: product.id,
					name: product.name,
					description: product.description,
					price: product.price,
					size: product.size,
					quantity: product.quantity,
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
								logo: product.store.storeLogo
									? product.store.storeLogo.map(image => ({
											id: image.id,
											logo: image.path,
									  }))
									: [],
						  }
						: null,
					isInCart,
				},
			};

			res.status(200).json({
				result,
				message: 'Product fetched successfully',
			});
		} catch (error) {
			return handleErrorResponse(res, 500, 'Error fetching product', error);
		}
	},

	async getProductsByCategory(req, res) {
		try {
			const { categoryId } = req.params;
			const page = +req.query.page || 1;
			const limit = +req.query.limit || 10;
			const { minPrice = 0, maxPrice = 1000000 } = req.query;

			const category = await ProductCategories.findOne({
				where: { categoryId },
			});
			if (!category) {
				return res.status(404).json({ message: 'Category not found' });
			}

			const total = await ProductCategories.count({ where: { categoryId } });
			const { maxPageCount, offset } = calculatePagination(page, limit, total);

			if (page > maxPageCount) {
				return res.status(404).json({ message: 'Page not found' });
			}

			const productsList = await ProductCategories.findAll({
				where: { categoryId },
				limit,
				offset,
				attributes: ['categoryId'],
				include: [
					{
						model: Products,
						where: {
							price: {
								[Op.gte]: minPrice,
								[Op.lte]: maxPrice,
							},
						},
						order: [['createdAt', 'DESC']],
						include: [
							{
								model: Photo,
								as: 'productImage',
								attributes: ['path', 'id'],
							},
							{
								model: Stores,
								as: 'store',
								attributes: ['name'],
								include: [
									{
										model: Photo,
										as: 'storeLogo',
										attributes: ['id', 'path'],
									},
								],
							},
						],
					},
				],
			});

			if (productsList.length === 0) {
				return res
					.status(404)
					.json({ message: 'No products found for this category' });
			}

			return res.status(200).json({
				message: 'Products retrieved successfully',
				total,
				currentPage: page,
				maxPageCount,
				products: productsList,
			});
		} catch (error) {
			return handleErrorResponse(
				res,
				500,
				'Error fetching products by category',
				error
			);
		}
	},

	async searchAndFilterProducts(req, res) {
		try {
			const {
				s = '',
				minPrice = 0,
				maxPrice = 100000,
				storeId,
				page = 1,
				limit = 10,
				categoryIds,
			} = req.query;

			const userId = req.user?.id;

			const whereClause = {};

			if (s) {
				whereClause.name = { [Op.like]: `%${s}%` };
			}

			if (minPrice && maxPrice) {
				whereClause.price = { [Op.between]: [+minPrice, +maxPrice] };
			} else if (minPrice) {
				whereClause.price = { [Op.gte]: +minPrice };
			} else if (maxPrice) {
				whereClause.price = { [Op.lte]: +maxPrice };
			}

			if (storeId) {
				whereClause.storeId = storeId;
			}

			const categoryArray = categoryIds
				? Array.isArray(categoryIds)
					? categoryIds
					: categoryIds
							.split(',')
							.map(id => parseInt(id, 10))
							.filter(id => !isNaN(id))
				: [];

			const total = await Products.count({
				where: whereClause,
				include: categoryArray.length
					? [
							{
								model: ProductCategories,
								as: 'categories',
								where: { categoryId: { [Op.in]: categoryArray } },
								required: true,
							},
					  ]
					: [],
			});

			const { maxPageCount, offset } = calculatePagination(page, limit, total);

			const productsList = await Products.findAll({
				where: whereClause,
				limit: +limit,
				offset,
				include: [
					{
						model: Photo,
						as: 'productImage',
						attributes: ['id', 'path'],
					},
					{
						model: Discounts,
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
						attributes: ['name'],
						include: [
							{
								model: Photo,
								as: 'storeLogo',
								attributes: ['id', 'path'],
							},
						],
					},
					{
						model: ProductCategories,
						as: 'categories',
						required: categoryArray.length > 0,
						where: categoryArray.length
							? { categoryId: { [Op.in]: categoryArray } }
							: undefined,
						attributes: ['categoryId'],
					},
				],
				order: [['createdAt', 'DESC']],
			});

			let cartProducts = [];
			if (userId) {
				cartProducts = await Cards.findAll({
					where: { userId },
					attributes: ['id', 'productId', 'quantity'],
				});
			}

			const cartProductMap = cartProducts.reduce((map, cart) => {
				map[cart.productId] = {
					isInCart: true,
					cartId: cart.id,
					quantity: cart.quantity,
				};
				return map;
			}, {});

			const updatedProductsList = productsList.map(product => {
				const productData = product.toJSON();

				if (!userId) {
					return productData;
				}

				return {
					...productData,
					isInCart: cartProductMap[product.id]
						? {
								cartId: cartProductMap[product.id].cartId,
								quantity: cartProductMap[product.id].quantity,
						  }
						: null,
				};
			});

			return res.status(200).json({
				message: 'Search results retrieved successfully',
				productsList: updatedProductsList || [],
				total,
				currentPage: page,
				maxPageCount,
			});
		} catch (error) {
			return handleErrorResponse(res, 500, 'Error searching products', error);
		}
	},

	async getMostPopularProducts(req, res) {
		const userId = req.user?.id;
		try {
			const popularProducts = await Payments.findAll({
				attributes: [
					'productId',
					[Sequelize.fn('COUNT', Sequelize.col('productId')), 'purchaseCount'],
				],
				group: ['productId'],
				order: [[Sequelize.fn('COUNT', Sequelize.col('productId')), 'DESC']],
				limit: 12,
			});

			if (popularProducts.length === 0) {
				return res.json({ message: 'No popular products' });
			}

			const productIds = popularProducts.map(item => item.productId);

			const productsWithDetails = await Products.findAll({
				where: { id: productIds },
				include: [
					{
						model: Photo,
						as: 'productImage',
						attributes: ['path'],
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
						attributes: ['name'],
						include: [
							{
								model: Photo,
								as: 'storeLogo',
								attributes: ['id', 'path'],
							},
						],
					},
					{
						model: ProductCategories,
						as: 'categories',
						include: [
							{
								model: Categories,
								as: 'category',
								attributes: ['id', 'name'],
							},
						],
					},
				],
			});

			let cartProducts = [];
			if (userId) {
				cartProducts = await Cards.findAll({
					where: { userId },
					attributes: ['id', 'productId', 'quantity'],
				});
			}

			const cartProductMap = cartProducts.reduce((map, cart) => {
				map[cart.productId] = {
					cartId: cart.id,
					quantity: cart.quantity,
				};
				return map;
			}, {});

			const formattedProducts = popularProducts.map(popular => {
				const product = productsWithDetails.find(
					p => p.id === popular.productId
				);

				if (!product) return null;

				return {
					purchaseCount: popular.dataValues.purchaseCount,
					id: product.id,
					name: product.name,
					size: product.size,
					price: product.price,
					description: product.description,
					brandName: product.brandName,
					quantity: product.quantity,
					discount: product.discount
						? {
								discountPercentage: product.discount.discountPercentage,
								discountPrice: product.discount.discountPrice,
								startDate: product.discount.startDate,
								endDate: product.discount.endDate,
						  }
						: null,
					productImage:
						product.productImage && product.productImage.length > 0
							? product.productImage.map(photo => ({
									path: photo.path,
							  }))
							: [],
					categories: product.categories.map(cat => ({
						id: cat.category.id,
						name: cat.category.name,
					})),
					store: product.store
						? {
								name: product.store.name,
								storeLogo: product.store.storeLogo.map(logo => ({
									id: logo.id,
									path: logo.path,
								})),
						  }
						: null,
					isInCart: cartProductMap[product.id]
						? {
								cartId: cartProductMap[product.id].cartId,
								quantity: cartProductMap[product.id].quantity,
						  }
						: null,
				};
			});

			if (formattedProducts.length === 0) {
				return res.json({ message: 'No popular products' });
			}

			res.json({
				message: 'Popular products successfully retrieved',
				data: formattedProducts,
			});
		} catch (error) {
			console.error(error);
			res.status(500).json({ success: false, message: error.message });
		}
	},

	async getDiscounts(req, res) {
		try {
			const limit = Math.max(1, Number(req.query.limit) || 10);
			const page = Math.max(1, Number(req.query.page) || 1);
			const storeId = req.query.storeId ? Number(req.query.storeId) : null;
			const userId = req.user?.id;

			const storeFilter = storeId ? { id: storeId } : {};

			const total = await Discounts.count({
				include: [
					{
						model: Products,
						where: storeId ? { storeId } : {},
					},
				],
				distinct: true,
			});

			const { maxPageCount, offset } = calculatePagination(page, limit, total);

			if (page > maxPageCount) {
				return res.status(404).json({ message: 'Page not found' });
			}

			const discountedProducts = await Products.findAll({
				include: [
					{
						model: Photo,
						as: 'productImage',
						attributes: ['id', 'path'],
					},
					{
						model: Discounts,
						required: true,
						where: {
							endDate: { [Op.gt]: new Date() },
						},
						attributes: [
							'id',
							'discountPercentage',
							'discountPrice',
							'startDate',
							'endDate',
						],
					},
					{
						model: Stores,
						attributes: ['id', 'name'],
						where: storeFilter,
						include: [
							{
								model: Photo,
								as: 'storeLogo',
								attributes: ['id', 'path'],
							},
						],
					},
				],
				limit,
				offset,
			});

			let cartProducts = [];
			if (userId) {
				cartProducts = await Cards.findAll({
					where: { userId },
					attributes: ['id', 'productId', 'quantity'],
				});
			}

			const cartProductMap = cartProducts.reduce((map, cart) => {
				map[cart.productId] = {
					cartId: cart.id,
					quantity: cart.quantity,
				};
				return map;
			}, {});

			const updatedDiscountedProducts = discountedProducts.map(product => {
				const productData = product.toJSON();

				return {
					...productData,
					isInCart: cartProductMap[product.id]
						? {
								cartId: cartProductMap[product.id].cartId,
								quantity: cartProductMap[product.id].quantity,
						  }
						: null,
				};
			});

			if (updatedDiscountedProducts.length === 0) {
				return res
					.status(404)
					.json({ message: 'No discounted products found' });
			}

			return res.json({
				discounts: updatedDiscountedProducts,
				total,
				currentPage: page,
				maxPageCount,
			});
		} catch (error) {
			console.error(error);
			return res
				.status(500)
				.json({ message: 'Server error', error: error.message });
		}
	},

	async removeExpiredDiscounts() {
		try {
			const now = new Date().toISOString().split('.')[0] + 'Z';

			const result = await Discounts.destroy({
				where: {
					endDate: { [Op.lt]: now },
				},
			});
			console.log(`[CRON] Removed ${result} expired discounts`);
		} catch (error) {
			console.error('[CRON] Error removing discounts:', error);
		}
	},
};
