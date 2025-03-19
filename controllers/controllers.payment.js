import yookassa from '../config/yookassaConfig.js';
import Products from '../models/Products.js';
import Payments from '../models/Payments.js';
import Photo from '../models/Photo.js';
import Users from '../models/Users.js';

const calculatePagination = (page, limit, total) => {
	const maxPageCount = Math.ceil(total / limit);
	const offset = (page - 1) * limit;
	return { maxPageCount, offset };
};

export default {
	async payment(req, res) {
		try {
			const { products } = req.body;
			const userId = req.user.id;

			const user = await Users.findOne({
				where: {
					id: userId,
				},
			});

			if (!products || !Array.isArray(products) || products.length === 0) {
				return res.status(400).json({ message: 'Products array is required' });
			}

			let totalPrice = 0;
			const productDetails = [];

			for (const item of products) {
				const { productId, quantity } = item;

				if (!productId || !quantity || quantity <= 0) {
					return res.status(400).json({ message: 'Invalid product data' });
				}

				const product = await Products.findByPk(productId);

				if (!product) {
					return res
						.status(404)
						.json({ message: `Product with ID ${productId} not found` });
				}

				const totalProductPrice = parseFloat(product.price) * quantity;
				totalPrice += totalProductPrice;

				productDetails.push({
					productId,
					quantity,
					price: product.price,
					name: product.name,
					totalProductPrice,
				});
			}

			const payment = await yookassa.createPayment({
				amount: {
					value: totalPrice.toFixed(2),
					currency: 'RUB',
				},
				payment_method_data: {
					type: 'bank_card',
				},
				confirmation: {
					type: 'redirect',
					return_url: process.env.FRONT_URL,
				},
				description: `Оплата за ${productDetails.length} товаров`,
			});

			for (const product of productDetails) {
				await Payments.create({
					userId: user.id,
					address: user.address,
					productId: product.productId,
					amount: product.totalProductPrice,
					quantity: product.quantity,
					paymentId: payment.id,
					transactionId: payment.id,
				});
			}

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
				const payment = await Payments.findOne({
					where: { transactionId: object.id },
				});

				if (!payment) {
					console.error('Платеж не найден');
					return res.sendStatus(404);
				}

				const product = await Products.findByPk(payment.productId);

				if (!product) {
					console.error('Продукт не найден');
					return res.sendStatus(404);
				}

				if (product.quantity < payment.quantity) {
					return res
						.status(400)
						.json({ error: 'Недостаточно товара на складе' });
				}

				await Products.update(
					{ quantity: product.quantity - payment.quantity },
					{ where: { id: product.id } }
				);

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
				attributes: [
					'amount',
					'status',
					'quantity',
					'createdAt',
					'updatedAt',
					'address',
				],
				include: [
					{
						model: Products,
						attributes: ['id', 'name', 'size', 'brandName'],
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
