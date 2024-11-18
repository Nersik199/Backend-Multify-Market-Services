import { v2 as cloudinary } from 'cloudinary';
import { Op } from 'sequelize';
//models
import Photo from '../models/Photo.js';
import Users from '../models/Users.js';
import Stores from '../models/Stores.js';
import Products from '../models/Products.js';
import Categories from '../models/Categories.js';
import ProductCategories from '../models/ProductCategories.js';
import StoreAdmin from '../models/StoreAdmin.js';

// utils
import updateImages from '../utils/updateImages.js';

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
			const { name, size, price, description, brandName } = req.body;
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
				storeId: store.storeId,
			});

			await ProductCategories.create({
				productId: productCreate.id,
				categoryId: categoryRecord.id,
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

			const total = await ProductCategories.count({ where: { categoryId } });

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
			const store = await StoreAdmin.findOne({ where: { userId: id } });

			if (!store) {
				res.status(404).json({
					message: 'Store not found',
				});
				return;
			}

			const products = await ProductCategories.findAll({
				where: { categoryId },
				attributes: ['productId', 'categoryId'],
				include: [
					{
						model: Products,
						include: [
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

	getAllProducts: async (req, res) => {
		try {
			const { id } = req.user;
			const { limit = 10, page = 1 } = req.query;

			const total = await Products.count();

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

			const store = await StoreAdmin.findOne({ where: { userId: id } });

			if (!store) {
				res.status(404).json({
					message: 'Store not found',
				});
				return;
			}

			const products = await Products.findAll({
				include: [
					{
						model: Photo,
						as: 'productImage',
						attributes: ['path', 'id'],
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
				imageId = null,
			} = req.body;
			const { id } = req.user;
			const { files = null } = req;

			const product = await Products.findOne({
				where: { id: productId },
				include: [
					{
						model: Photo,
						as: 'productImage',
						attributes: ['path', 'id'],
					},
				],
			});

			if (!product) {
				res.status(404).json({
					message: 'Product not found',
				});
				return;
			}

			const user = await Users.findByPk(id);

			if (user.role !== 'admin') {
				return res.status(401).json({
					message: 'You are not authorized to update this product',
				});
			}

			if (files && !imageId) {
				for (const file of files) {
					await Photo.create({
						path: file.path,
						productId: productId,
					});
				}
			}

			if (imageId && files) {
				await updateImages(res, 'Product', files, imageId);
			}

			const productUpdate = await product.update({
				name,
				size,
				price,
				description,
				brandName,
			});

			res.status(200).json({
				productUpdate,
				message: 'Product updated successfully',
			});
		} catch (error) {
			console.log(error);
			res.status(500).json({
				message: 'Error updating product',
			});
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
			} = req.query;

			const user = await StoreAdmin.findOne({ where: { userId: id } });

			if (!user) {
				res.status(404).json({ message: 'Store not found for this user' });
				return;
			}

			const total = await Products.count({
				where: {
					name: {
						[Op.like]: `%${search}%`,
					},
					price: {
						[Op.between]: [minPrice, maxPrice],
					},
				},
			});
			const { maxPageCount, offset } = calculatePagination(page, limit, total);

			if (page > maxPageCount) {
				res.status(404).json({ message: 'Page not found' });
				return;
			}

			const products = await Products.findAll({
				where: {
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
};
