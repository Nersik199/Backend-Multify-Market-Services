import jwt from 'jsonwebtoken';
import Users from '../models/Users.js';

const { JWT_TOKEN } = process.env;

export default async (req, res, next) => {
	const token = req.headers.authorization || req.cookies.authorization;

	if (!token) {
		req.user = null;
		return next();
	}

	try {
		const decryptedData = jwt.verify(token, JWT_TOKEN);

		const user = await Users.findByPk(decryptedData.id);
		if (!user) {
			req.user = null;
			return next();
		}

		req.user = decryptedData;

		next();
	} catch (error) {
		req.user = null;
		next();
	}
};
