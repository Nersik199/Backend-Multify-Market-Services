import { v2 as cloudinary } from 'cloudinary';

//models
import Photo from '../models/Photo.js';
import Users from '../models/Users.js';
import Stores from '../models/Stores.js';
import StoreAdmin from '../models/StoreAdmin.js';

export default {
	createStore: async (req, res) => {
		try {
			const { file = null } = req;
			const { name, location } = req.body;
			const { id } = req.user;

			const user = await Users.findByPk(id);
			if (user.role !== 'superAdmin') {
				return res.status(401).json({
					message: 'You are not authorized to create a store',
				});
			}

			const storeCreate = await Stores.create({
				name: name.trim().toLowerCase(),
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

	getStores: async (req, res) => {
		try {
			const stores = await Stores.findAll({
				attributes: ['id', 'name', 'location'],
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
		} catch (error) {
			console.log(error);
			res.status(500).json({
				message: 'Error fetching stores',
			});
		}
	},

	setupUserStore: async (req, res) => {
		try {
			const { id } = req.user;
			const { email, storeName } = req.body;
			const admin = await Users.findByPk(id);

			if (!admin || admin.role !== 'superAdmin') {
				return res.status(401).json({
					message: 'You are not authorized to create a store',
				});
			}

			const user = await Users.findOne({
				where: { email: email.trim().toLowerCase() },
			});
			const store = await Stores.findOne({
				where: { name: storeName.trim().toLowerCase() },
			});

			if (!user || !store) {
				return res.status(404).json({
					message: 'User or store not found',
				});
			}

			const storeAdmin = await StoreAdmin.findOne({
				where: { userId: user.id },
			});

			if (storeAdmin) {
				return res.status(409).json({
					message: 'User already has a store',
				});
			}

			await StoreAdmin.create({
				userId: user.id,
				storeId: store.id,
			});

			res.status(201).json({
				message: 'User and store created successfully',
			});
		} catch (error) {
			console.error('Error in setupUserStore:', error);
			res.status(500).json({
				message: 'Error creating user and store',
			});
		}
	},
};
