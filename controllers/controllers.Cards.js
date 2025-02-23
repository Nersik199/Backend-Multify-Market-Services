import Cards from '../models/Cards.js';
import Products from '../models/Products.js';
import Photo from '../models/Photo.js';

const calculatePagination = (page, limit, total) => {
	const maxPageCount = Math.ceil(total / limit);
	const offset = (page - 1) * limit;
	return { maxPageCount, offset };
};

export default {
	async create(req, res) {
		try {
			const { id: userId } = req.user;
			const { productId, quantity } = req.body;

			const product = await Products.findOne({ where: { id: productId } });

			if (!product) {
				res.status(400).json({
					message: 'Product does not exist',
				});
				return;
			}

			const existingCard = await Cards.findOne({
				where: { productId, userId },
			});

			if (existingCard) {
				res.status(400).json({
					message: 'This product is already in your cart',
				});
				return;
			}

			const cards = await Cards.create({
				productId,
				userId,
				quantity,
			});

			res.status(201).json({
				message: 'Cards created successfully',
				cards,
			});
		} catch (e) {
			res.status(500).json({
				message: 'Internal server error',
				error: e.message,
			});
		}
	},
	async getCards(req, res) {
		try {
			const { id: userId } = req.user;
			const { page = 1, limit = 10 } = req.query;

			const total = await Cards.count({ where: { userId } });

			const { maxPageCount, offset } = calculatePagination(page, limit, total);

			if (page > maxPageCount) {
				res.status(404).json({ message: 'Page not found' });
				return;
			}

			const cardsWithProducts = await Cards.findAll({
				where: { userId },
				attributes: ['id', 'quantity'],
				include: [
					{
						model: Products,
						as: 'product',
						attributes: ['id', 'name', 'price'],
						include: [
							{
								model: Photo,
								as: 'productImage',
								attributes: ['id', 'path'],
							},
						],
					},
				],
				limit: +limit,
				offset: +offset,
			});

			res.status(200).json({
				message: 'Cards retrieved successfully',
				cards: cardsWithProducts,
				total,
				currentPage: page,
				maxPageCount,
			});
		} catch (error) {
			res.status(500).json({
				message: 'Internal server error',
				error: error.message,
			});
		}
	},
	async update(req, res) {
		try {
			const { cardId: id } = req.params;
			const { quantity } = req.body;

			if (!id) {
				res.status(400).json({
					message: 'Id is required',
				});
				return;
			}

			const cards = await Cards.findByPk(id);

			if (!cards) {
				res.status(404).json({
					message: 'Cards Id not found.',
				});
				return;
			}

			await cards.update({
				quantity,
				where: { id },
			});

			res.status(200).json({
				message: 'Cards updated successfully.',
			});
		} catch (e) {
			res.status(500).json({
				message: 'Internal server error',
				error: e.message,
			});
		}
	},
	async delete(req, res) {
		try {
			const { cardId: id } = req.params;

			if (!id) {
				res.status(400).json({
					message: 'Id is required',
				});
				return;
			}

			const cards = await Cards.findByPk(id);

			if (!cards) {
				res.status(404).json({
					message: 'Cards Id not found.',
				});
				return;
			}

			await cards.destroy({
				where: { id },
			});

			res.status(200).json({
				message: 'Cards deleted successfully.',
			});
		} catch (e) {
			res.status(500).json({
				message: 'Internal server error',
				error: e.message,
			});
		}
	},
	async deleteAll(req, res) {
		try {
			const { id: userId } = req.user;

			await Cards.destroy({ where: { userId } });

			res.status(200).json({
				message: 'All products removed from the cart successfully.',
			});
		} catch (e) {
			res.status(500).json({
				message: 'Internal server error',
				error: e.message,
			});
		}
	},
};
