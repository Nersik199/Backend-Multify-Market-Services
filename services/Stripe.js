import Stripe from 'stripe';
const { STRIPE_SECRET_KEY } = process.env;

const stripe = new Stripe(STRIPE_SECRET_KEY, {
	apiVersion: '2023-08-27',

});

export default stripe;
