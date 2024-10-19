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
			if (!user) {
				return res.status(404).json({
					message: 'User not found',
				});
			}
			const storeCreate = await Stores.create({
				name,
				location,
				ownerId: user.id,
			});

			if (!storeCreate) {
				await cloudinary.uploader.destroy(file.filename);
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

	createProduct: async (req, res) => {
		try {
			const { files = null } = req;
			const { name, size, price, description, category } = req.body;
			const { id } = req.user;
			console.log(req.body);

			const user = await Users.findByPk(id);
			if (!user) {
				return res.status(404).json({
					message: 'User not found',
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
				where: { name: category },
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
};
