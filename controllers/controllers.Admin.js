import { v2 as cloudinary } from 'cloudinary';

//models
import Photo from '../models/Photo.js';
import Users from '../models/Users.js';
import Stores from '../models/Stores.js';
import Products from '../models/Products.js';
import Categories from '../models/Categories.js';
import ProductCategories from '../models/ProductCategories.js';

export default {
	createStore: async (req, res) => {
		try {
			const { file = null } = req;
			const { name, location } = req.body;
			const { id } = req.user;

			const user = await Users.findByPk(id);
			if (user.role !== 'admin') {
				return res.status(401).json({
					message: 'You are not authorized to create a store',
				});
			}

			const storeCreate = await Stores.create({
				name,
				location,
				ownerId: user.id,
			});

			if (!storeCreate) {
				if (file && file.public_id) {
					await cloudinary.uploader.destroy(file.public_id);
				}
				return res.status(500).json({
					message: 'Error creating store',
				});
			}

			if (file) {
				await Photo.create({
					storeId: storeCreate.id,
					path: file.path,
				});
			}

			const store = await Stores.findByPk(storeCreate.id, {
				include: [
					{
						model: Photo,
						as: 'storeLogo',
						attributes: ['path'],
					},
				],
			});

			res.status(201).json({
				store,
				message: 'Store created successfully',
			});
		} catch (error) {
			console.log(error);
			res.status(500).json({
				message: 'Error creating store',
			});
		}
	},

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
			const { files = null } = req;
			const { categoryId } = req.params;
			const { name, size, price, description, category } = req.body;
			const { id } = req.user;

			const user = await Users.findByPk(id);
			if (user.role !== 'admin') {
				return res.status(401).json({
					message: 'You are not authorized to create a product',
				});
			}

			const store = await Stores.findOne({
				where: { ownerId: user.id },
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
				category,
				storeId: store.id,
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

			if (files) {
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

			const offset = (page - 1) * limit;

			if (!categoryId) {
				res.status(400).json({
					message: 'Category ID is required',
				});
				return;
			}
			const store = await Stores.findOne({ where: { ownerId: id } });

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
								where: { name: store.name },
							},
							{
								model: Photo,
								as: 'productImage',
								attributes: ['path'],
							},
						],
					},
				],
				order: [['id', 'DESC']],
				limit: +limit,
				offset: +offset,
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
				default: `page=${page} limit=${limit}`,
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

			const user = await Users.findByPk(id);
			if (user.role !== 'admin') {
				return res.status(401).json({
					message: 'You are not authorized to get all products',
				});
			}

			const store = await Stores.findOne({ where: { ownerId: id } });

			const products = await Products.findAll({
				include: [
					{
						model: Photo,
						as: 'productImage',
						attributes: ['path'],
					},
					{
						model: Stores,
						attributes: ['name'],
						where: { name: store.name },
					},
				],
			});
			if (!products) {
				res.status(404).json({
					message: 'Products not found',
				});
				return;
			}

			res.status(200).json({
				products,
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
			const { name, size, price, description, category } = req.body;
			const { id } = req.user;
			const { files = null } = req.files;
			const product = await Products.findOne({ where: { id: productId } });
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

			if (files) {
				for (const file of files) {
					await Photo.create({
						productId: product.id,
						path: file.path,
					});
				}
			}

			await product.update({
				name,
				size,
				price,
				description,
				category,
			});
			res.status(200).json({
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
			const store = await Stores.findOne({ where: { ownerId: user.id } });
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
};
