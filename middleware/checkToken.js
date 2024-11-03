import jwt from 'jsonwebtoken';
import Users from '../models/Users.js';

const { JWT_TOKEN } = process.env;

export default async (req, res, next) => {
	const token = req.headers.authorization;
	if (!token) {
		res.status(401).json({ message: 'Unauthorized' });
		return;
	}

	try {
		const decryptedData = jwt.verify(token, JWT_TOKEN);

		const user = await Users.findByPk(decryptedData.id);
		if (!user) {
			res.status(401).json({
				message: 'Invalid or expired token',
			});
			return;
		}

		req.user = decryptedData;

		next();
	} catch (error) {
		res.status(401).json({
			message: 'Invalid or expired token',
		});
	}
};
