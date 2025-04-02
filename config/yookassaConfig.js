import { YooCheckout } from '@a2seven/yoo-checkout';
import dotenv from 'dotenv';
dotenv.config();

const { YOOKASSA_SHOP_ID, YOOKASSA_SECRET_KEY } = process.env;

const yooKassa = new YooCheckout({
	shopId: YOOKASSA_SHOP_ID,
	secretKey: YOOKASSA_SECRET_KEY,
});

export default yooKassa;
