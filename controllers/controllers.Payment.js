import stripe from '../services/Stripe.js'

export default {
    async createPaymentIntent(req, res) {
        try {
            const { amount, currency = 'usd' } = req.body;

            if (!amount || amount <= 0) {
                return res.status(400).json({ message: 'Invalid payment amount.' });
            }

            const paymentIntent = await stripe.paymentIntents.create({
                amount,
                currency,
                automatic_payment_methods: { enabled: true },
            });

            return res.status(200).json({
                   clientSecret: paymentIntent.client_secret,
                   message: 'Payment intent created successfully.',
            });
        } catch (error) {
            console.error('Error creating payment intent:', error);
            res.status(500).json({ message: 'Failed to create payment intent.', error: error.message });
        }
    },
};