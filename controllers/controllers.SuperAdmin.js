import { v2 as cloudinary } from 'cloudinary';
import { Op, Sequelize } from 'sequelize';
// Models
import Photo from '../models/Photo.js';
import Users from '../models/Users.js';
import Stores from '../models/Stores.js';
import StoreAdmin from '../models/StoreAdmin.js';
import Payments from '../models/Payments.js';
import Products from '../models/Products.js';

const calculatePagination = (page, limit, total) => {
	const maxPageCount = Math.ceil(total / limit);
	const offset = (page - 1) * limit;
	return { maxPageCount, offset };
};

export default {
	createStore: async (req, res) => {
		try {
			const { file = null } = req;
			const { name, location, webSiteUrl, videoUrl, about } = req.body;
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
				webSiteUrl: webSiteUrl.trim(),
				videoUrl: videoUrl.trim(),
				about: about.trim(),
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

	getAdminStore: async (req, res) => {
		try {
			const { id } = req.user;
			const { storeId } = req.params;
			const user = await Users.findByPk(id);
			if (!user || user.role !== 'superAdmin') {
				return res.status(401).json({
					message: 'You are not authorized to view this store',
				});
			}

			const store = await StoreAdmin.findAll({
				where: { storeId },
				attributes: ['storeId'],
				include: [
					{
						model: Users,
						attributes: ['id', 'email', 'role'],
						include: {
							model: Photo,
							as: 'avatar',
							attributes: ['path'],
						},
					},
				],
			});
			if (!store) {
				return res.status(404).json({
					message: 'Store not found',
				});
			}
			return res.status(200).json({
				store,
				message: 'Store fetched successfully',
			});
		} catch (error) {
			console.error('Error fetching store:', error);
			res.status(500).json({
				message: 'Error fetching store',
			});
		}
	},

	updateAdminInUser: async (req, res) => {
		try {
			const { id } = req.user;
			const { adminId, storeId } = req.body;

			if (!storeId || !adminId) {
				return res.status(400).json({
					message: 'Please provide storeId and adminId in the request body',
				});
			}

			const superAdmin = await Users.findByPk(id);
			if (!superAdmin || superAdmin.role !== 'superAdmin') {
				return res.status(401).json({
					message: 'You are not authorized to update this store',
				});
			}

			const user = await Users.findOne({
				where: { id: adminId, role: 'admin' },
			});
			if (!user) {
				return res.status(401).json({
					message: 'Admin not found',
				});
			}

			const store = await StoreAdmin.destroy({
				where: { storeId, userId: adminId },
			});

			if (!store) {
				return res.status(404).json({
					message: 'Store not found',
				});
			}

			await Users.update(
				{ role: 'user' },
				{
					where: { id: adminId },
				}
			);

			return res.status(200).json({
				message: 'admin removed successfully',
			});
		} catch (error) {
			console.error('Error updating store:', error);
			res.status(500).json({
				message: 'Error updating store',
			});
		}
	},

	setupUserStore: async (req, res) => {
		try {
			const { id } = req.user;
			const { email, storeId } = req.body;
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
				where: { id: storeId },
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

			await Users.update(
				{ role: 'admin' },
				{
					where: { id: user.id },
				}
			);

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

	getStatistics: async (req, res) => {
		try {
			const { storeId } = req.params;
			let { startDate, endDate } = req.query;
			const { id } = req.user;

			const user = await Users.findByPk(id);
			if (!user || user.role !== 'superAdmin') {
				return res.status(401).json({
					message: 'You are not authorized to view statistics',
				});
			}

			if (!storeId) {
				return res.status(400).json({
					message: 'Please provide a storeId in the request parameters',
				});
			}

			if (!startDate || !endDate) {
				const now = new Date();
				const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
				const lastDayOfMonth = new Date(
					now.getFullYear(),
					now.getMonth() + 1,
					0
				);

				startDate = firstDayOfMonth.toISOString().split('T')[0];
				endDate = lastDayOfMonth.toISOString().split('T')[0];
			}

			const start = new Date(startDate);
			const end = new Date(endDate);

			if (isNaN(start.getTime()) || isNaN(end.getTime())) {
				return res.status(400).json({
					message: 'Invalid date format. Please use YYYY-MM-DD',
				});
			}

			const store = await Stores.findByPk(storeId, {
				attributes: ['id', 'name', 'location'],
			});

			if (!store) {
				return res.status(404).json({
					message: 'Store not found',
				});
			}

			const productCountAllTime = await Products.count({
				where: { storeId: store.id },
			});
			const totalProductsSoldAllTime = await Payments.sum('quantity', {
				where: {
					storeId: store.id,
					status: { [Op.in]: ['paid', 'received'] },
				},
			});
			const totalRevenueAllTime = await Payments.sum('amount', {
				where: {
					storeId: store.id,
					status: { [Op.in]: ['paid', 'received'] },
				},
			});
			const totalProductsSoldPeriod = await Payments.sum('quantity', {
				where: {
					storeId: store.id,
					status: { [Op.in]: ['paid', 'received'] },
					createdAt: { [Op.between]: [start, end] },
				},
			});
			const totalRevenuePeriod = await Payments.sum('amount', {
				where: {
					storeId: store.id,
					status: { [Op.in]: ['paid', 'received'] },
					createdAt: { [Op.between]: [start, end] },
				},
			});
			const totalProductPeriod = await Products.count({
				where: {
					storeId: store.id,
					createdAt: { [Op.between]: [start, end] },
				},
			});

			const salesStatistics = await Payments.findAll({
				attributes: [
					[Sequelize.literal("DATE_FORMAT(createdAt, '%Y-%m-%d')"), 'interval'],
					[Sequelize.fn('SUM', Sequelize.col('amount')), 'totalRevenue'],
					[Sequelize.fn('COUNT', Sequelize.col('id')), 'totalOrders'],
				],
				where: {
					storeId: store.id,
					status: { [Op.in]: ['paid', 'received'] },
					createdAt: { [Op.between]: [start, end] },
				},
				group: ['interval'],
				order: [['interval', 'ASC']],
				raw: true,
			});

			res.status(200).json({
				data: {
					productCountAllTime: productCountAllTime || 0,
					totalProductsSoldAllTime: totalProductsSoldAllTime.toFixed() || 0,
					totalRevenueAllTime: totalRevenueAllTime || 0,
					totalProductsSoldPeriod: totalProductsSoldPeriod || 0,
					totalRevenuePeriod: totalRevenuePeriod || 0,
					totalProductPeriod: totalProductPeriod || 0,
					statistics: [
						{
							storeId: store.id,
							storeName: store.name,
							statistics: salesStatistics.map(stat => ({
								interval: stat.interval,
								totalRevenue: parseFloat(stat.totalRevenue),
								totalOrders: parseInt(stat.totalOrders, 10),
							})),
						},
					],
				},
				message: 'Sales statistics for the store fetched successfully',
			});
		} catch (error) {
			console.error('Error fetching sales statistics for the store:', error);
			res.status(500).json({
				message: 'Error fetching sales statistics for the store',
			});
		}
	},

	getBuyers: async (req, res) => {
		try {
			const { storeId } = req.params;
			const { startDate, endDate } = req.query;
			const { id } = req.user;
			const user = await Users.findByPk(id);
			if (!user || user.role !== 'superAdmin') {
				return res.status(401).json({
					message: 'You are not authorized to view statistics',
				});
			}
			if (!storeId) {
				return res.status(400).json({
					message: 'Please provide a storeId in the request parameters',
				});
			}

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

			if (!userIds.length) {
				return res.status(200).json({
					storeId,
					buyers: [],
					message: 'No buyers found for this period',
				});
			}

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

	updateStore: async (req, res) => {
		try {
			const { storeId } = req.params;
			const { name, location, webSiteUrl, videoUrl, about } = req.body;
			const { id } = req.user;
			const file = req.file;

			const user = await Users.findByPk(id);
			if (!user || user.role !== 'superAdmin') {
				return res.status(401).json({
					message: 'You are not authorized to update a store',
				});
			}

			const store = await Stores.findByPk(storeId, {
				include: [
					{
						model: Photo,
						as: 'storeLogo',
						attributes: ['id', 'path'],
					},
				],
			});

			if (!store) {
				return res.status(404).json({
					message: 'Store not found',
				});
			}

			if (file && store.storeLogo && store.storeLogo.length > 0) {
				const oldLogo = store.storeLogo[0];
				console.log('oldLogo', oldLogo);

				const fileName = `Store/${oldLogo.path
					.split('/')
					.pop()
					.split('.')
					.slice(0, -1)
					.join('.')}`;
				console.log('fileName', fileName);
				await cloudinary.uploader.destroy(fileName);
				await Photo.update({ path: file.path }, { where: { id: oldLogo.id } });
			}

			await store.update({
				name: name ? name.trim().toLowerCase() : store.name,
				videoUrl: videoUrl || store.videoUrl,
				webSiteUrl: webSiteUrl || store.webSiteUrl,
				about: about || store.about,
				location: location || store.location,
			});

			const updatedStore = await Stores.findByPk(storeId, {
				include: [
					{
						model: Photo,
						as: 'storeLogo',
						attributes: ['id', 'path'],
					},
				],
			});

			res.status(200).json({
				store: updatedStore,
				message: 'Store updated successfully',
			});
		} catch (error) {
			console.error('Error updating store:', error);
			res.status(500).json({
				message: 'Error updating store',
			});
		}
	},

	deleteStore: async (req, res) => {
		try {
			const { storeId } = req.params;
			const { id } = req.user;

			const user = await Users.findByPk(id);
			if (!user || user.role !== 'superAdmin') {
				return res.status(401).json({
					message: 'You are not authorized to delete a store',
				});
			}

			const store = await Stores.findByPk(storeId);
			if (!store) {
				return res.status(404).json({
					message: 'Store not found',
				});
			}

			await store.destroy();

			res.status(200).json({
				message: 'Store deleted successfully',
			});
		} catch (error) {
			console.error('Error deleting store:', error);
			res.status(500).json({
				message: 'Error deleting store',
			});
		}
	},

	getAllStoresStatistics: async (req, res) => {
		try {
			const { id } = req.user;
			let { startDate, endDate } = req.query;

			const user = await Users.findByPk(id);
			if (!user || user.role !== 'superAdmin') {
				return res.status(401).json({
					message: 'You are not authorized to view statistics',
				});
			}

			if (!startDate || !endDate) {
				const now = new Date();
				const lastMonth = new Date(now);
				lastMonth.setMonth(now.getMonth() - 1);

				startDate = lastMonth.toISOString().split('T')[0];
				endDate = now.toISOString().split('T')[0];
			}

			const start = new Date(startDate);
			const end = new Date(endDate);

			if (isNaN(start.getTime()) || isNaN(end.getTime())) {
				return res.status(400).json({
					message: 'Invalid date format. Please use YYYY-MM-DD',
				});
			}

			const stores = await Stores.findAll({
				attributes: ['id', 'name', 'location'],
				order: [['id', 'ASC']],
			});

			if (!stores.length) {
				return res.status(404).json({
					message: 'No stores found',
				});
			}

			let productCountAllTime = 0;
			let totalProductsSoldAllTime = 0;
			let totalRevenueAllTime = 0;
			let totalProductsSoldPeriod = 0;
			let totalRevenuePeriod = 0;
			let totalProductPeriod = 0;

			const statistics = [];

			await Promise.all(
				stores.map(async store => {
					const productCount = await Products.count({
						where: { storeId: store.id },
					});
					const productsSoldAllTime = await Payments.sum('quantity', {
						where: {
							storeId: store.id,
							status: { [Op.in]: ['paid', 'received'] },
						},
					});
					const revenueAllTime = await Payments.sum('amount', {
						where: {
							storeId: store.id,
							status: { [Op.in]: ['paid', 'received'] },
						},
					});

					const productsSoldPeriod = await Payments.sum('quantity', {
						where: {
							storeId: store.id,
							status: { [Op.in]: ['paid', 'received'] },
							createdAt: { [Op.between]: [start, end] },
						},
					});
					const revenuePeriod = await Payments.sum('amount', {
						where: {
							storeId: store.id,
							status: { [Op.in]: ['paid', 'received'] },
							createdAt: { [Op.between]: [start, end] },
						},
					});
					const productPeriod = await Products.count({
						where: {
							storeId: store.id,
							createdAt: { [Op.between]: [start, end] },
						},
					});

					const salesStatistics = await Payments.findAll({
						attributes: [
							[
								Sequelize.literal("DATE_FORMAT(createdAt, '%Y-%m-%d')"),
								'interval',
							],
							[Sequelize.fn('SUM', Sequelize.col('amount')), 'totalRevenue'],
							[Sequelize.fn('COUNT', Sequelize.col('id')), 'totalOrders'],
						],
						where: {
							storeId: store.id,
							status: { [Op.in]: ['paid', 'received'] },
							createdAt: { [Op.between]: [start, end] },
						},
						group: ['interval'],
						order: [['interval', 'ASC']],
						raw: true,
					});

					productCountAllTime += productCount || 0;
					totalProductsSoldAllTime += productsSoldAllTime || 0;
					totalRevenueAllTime += revenueAllTime
						? Number(revenueAllTime.toFixed())
						: 0;
					totalProductsSoldPeriod += productsSoldPeriod || 0;
					totalRevenuePeriod += revenuePeriod
						? Number(revenuePeriod.toFixed())
						: 0;
					totalProductPeriod += productPeriod || 0;

					statistics.push({
						storeId: store.id,
						storeName: store.name,
						statistics: salesStatistics.map(stat => ({
							interval: stat.interval,
							totalRevenue: parseFloat(stat.totalRevenue),
							totalOrders: parseInt(stat.totalOrders, 10),
						})),
					});
				})
			);

			statistics.sort((a, b) => a.storeId - b.storeId);

			res.status(200).json({
				data: {
					productCountAllTime,
					totalProductsSoldAllTime,
					totalRevenueAllTime,
					totalProductsSoldPeriod,
					totalRevenuePeriod,
					totalProductPeriod,
					statistics,
				},
				message: 'Sales statistics for all stores fetched successfully',
			});
		} catch (error) {
			console.error('Error fetching statistics for all stores:', error);
			res.status(500).json({
				message: 'Error fetching statistics for all stores',
			});
		}
	},

	getAllUsers: async (req, res) => {
		try {
			const { id } = req.user;
			const { limit = 10, page = 1, role } = req.query;

			const user = await Users.findByPk(id);
			if (!user || user.role !== 'superAdmin') {
				return res.status(401).json({
					message: 'You are not authorized to view users',
				});
			}

			const whereCondition = {
				role: {
					[Op.not]: ['superAdmin'],
				},
			};

			if (role) {
				whereCondition.role = role;
			}

			const total = await Users.count({ where: whereCondition });
			const { maxPageCount, offset } = calculatePagination(page, limit, total);

			if (page > maxPageCount) {
				return res.status(404).json({ message: 'Page not found' });
			}

			const users = await Users.findAll({
				attributes: [
					'id',
					'email',
					'role',
					'firstName',
					'lastName',
					'gender',
					'dateOfBirth',
					'status',
					'resetCode',
					'activationKey',
					'createdAt',
					'updatedAt',
				],
				where: whereCondition,
				include: [
					{
						model: Photo,
						as: 'avatar',
						attributes: ['path'],
					},
				],
				order: [['id', 'DESC']],
				limit: +limit,
				offset,
			});

			res.status(200).json({
				users,
				total,
				currentPage: page,
				maxPageCount,
				message: 'Users fetched successfully',
			});
		} catch (error) {
			console.error('Error fetching users:', error);
			res.status(500).json({
				message: 'Error fetching users',
			});
		}
	},
};
