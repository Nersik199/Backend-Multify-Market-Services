import yookassa from '../config/yookassaConfig.js';
import Products from '../models/Products.js';
import Payments from '../models/Payments.js';
import Photo from '../models/Photo.js';

const calculatePagination = (page, limit, total) => {
	const maxPageCount = Math.ceil(total / limit);
	const offset = (page - 1) * limit;
	return { maxPageCount, offset };
};

export default {
	async payment(req, res) {
		try {
			const { productId: id, price } = req.body;
			const userId = req.user.id;

			if (!id || !price) {
				return res
					.status(400)
					.json({ message: 'Product ID and price are required' });
			}

			const product = await Products.findByPk(id);

			if (!product) {
				return res.status(404).json({ message: 'Product not found' });
			}

			const payment = await yookassa.createPayment({
				amount: {
					value: price,
					currency: 'RUB',
				},
				payment_method_data: {
					type: 'bank_card',
				},
				confirmation: {
					type: 'redirect',
					return_url: process.env.FRONT_URL,
				},
				description: `Оплата за товар ${product.dataValues.name}`,
			});

			await Payments.create({
				userId,
				productId: id,
				amount: price,
				paymentId: payment.id,
				transactionId: payment.id,
			});

			res.status(201).json({ payment });
		} catch (error) {
			console.error(error);
			res.status(500).json({ error: error.message });
		}
	},
	async getEvent(req, res) {
		try {
			const { event, object } = req.body;

			if (
				event === 'payment.waiting_for_capture' &&
				object.status === 'waiting_for_capture'
			) {
				try {
					await yookassa.capturePayment(object.id, {
						amount: {
							value: parseFloat(object.amount.value).toFixed(2),
							currency: object.amount.currency,
						},
					});
					return res.sendStatus(200);
				} catch (captureError) {
					console.error(captureError);
					return res.status(500).json({ error: captureError.message });
				}
			}

			if (event === 'payment.succeeded') {
				await Payments.update(
					{ status: 'paid' },
					{ where: { transactionId: object.id } }
				);
				return res.sendStatus(200);
			}

			if (event === 'payment.canceled') {
				await Payments.update(
					{ status: 'failed' },
					{ where: { transactionId: object.id } }
				);

				return res.sendStatus(200);
			}

			return res.sendStatus(200);
		} catch (error) {
			console.error(error);
			return res.status(500).json({ error: error.message });
		}
	},

	async getUserPayments(req, res) {
		try {
			const { id } = req.user;
			const { limit = 10, page = 1 } = req.query;

			const total = await Payments.count({ where: { userId: id } });
			const { maxPageCount, offset } = calculatePagination(page, limit, total);

			if (page > maxPageCount) {
				return res.status(404).json({ message: 'Page not found' });
			}

			const payments = await Payments.findAll({
				where: { userId: id },
				attributes: ['amount', 'status', 'createdAt', 'updatedAt'],
				include: [
					{
						model: Products,
						attributes: ['name', 'size', 'brandName'],
						include: [
							{
								model: Photo,
								as: 'productImage',
								attributes: ['path'],
							},
						],
					},
				],
				order: [['createdAt', 'DESC']],
				limit: +limit,
				offset,
			});

			if (payments.length === 0) {
				return res.json({ message: 'No payments found' });
			}

			res.json({
				message: 'Payments retrieved successfully',
				total,
				currentPage: page,
				maxPageCount,
				data: payments,
			});
		} catch (error) {
			console.error(error);
			res.status(500).json({ success: false, message: error.message });
		}
	},
};
