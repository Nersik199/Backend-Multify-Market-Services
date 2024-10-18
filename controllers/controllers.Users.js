import { v2 as cloudinary } from 'cloudinary';
import { v4 as uuid } from 'uuid';

import Users from '../models/Users.js';
import Photo from '../models/Photo.js';

import { sendMail } from '../services/Mail.js';

export default {
	async registration(req, res) {
		try {
			const { firstName, lastName, email, phone, password } = req.body;
			const { file } = req;
			const mailExists = await Users.findOne({
				where: { email },
			});

			if (mailExists) {
				if (file) {
					await cloudinary.uploader.destroy(file.filename);
				}
				return res.status(409).json({
					message: 'Email already exists',
				});
			}
			const user = await Users.create({
				firstName,
				lastName,
				phone,
				email: email.toLowerCase(),
				password: password,
			});

			await Photo.create({
				userId: user.id,
				path: file.path,
			});

			const result = await Users.findByPk(user.id, {
				include: [
					{
						model: Photo,
						as: 'avatar',
						attributes: ['path'],
					},
				],
			});
			const activationKey = uuid();

			await Users.update(
				{
					activationKey,
				},
				{ where: { id: user.id } }
			);

			await sendMail({
				to: result.email,
				subject: 'welcome to our site',
				template: 'sendEmailCode',
				templateData: {
					title: `hi ${user.firstName} ${user.lastName}`,
					avatar: result.avatar[0].path,
					link: `http://localhost:3000/users/activate?key=${activationKey}`,
				},
			});
			res.status(201).json({
				message: 'User created successfully',
				result,
			});
		} catch (e) {
			console.log(e);
			res.status(500).json({ message: e.message });
		}
	},

	async activeAccount(req, res) {
		try {
			const { key } = req.query;
			const user = await Users.findOne({
				where: { activationKey: key },
			});

			if (!user) {
				res.status(404).json({
					message: 'User does not exist',
				});
				return;
			}

			if (user.status === 'active') {
				res.status(200).json({
					message: 'Account already activated',
				});
				return;
			}

			await Users.update({ status: 'active' }, { where: { id: user.id } });

			res.status(200).json({
				message: 'Account activated successfully',
			});
		} catch (error) {
			console.log(error);
			res.status(500).json({
				message: 'Internal server error',
				error: error.message,
			});
		}
	},
	async login(req, res) {
		try {
			const { email, password } = req.body;

			const user = await Users.findOne({
				where: { email },
			});

			if (
				!user ||
				Users.hashPassword(password) !== user.getDataValue('password')
			) {
				res.status(401).json({
					message: 'Invalid email or password',
				});
				return;
			}

			if (user.status !== 'active') {
				res.status(401).json({
					message: 'Please activate your account',
				});
				return;
			}

			const payload = {
				id: user.id,
				email: user.email,
			};

			const token = Users.createToken(payload);

			if (user.role === 'admin') {
				res.status(200).json({
					message: 'Login successful',
					token,
					isAdmin: true,
				});
				return;
			}

			res.status(200).json({
				message: 'Login successful',
				token,
				isAdmin: false,
			});
		} catch (error) {
			console.log(error);
			res.status(500).json({
				message: 'Internal server error',
				error: error.message,
			});
		}
	},

	async profile(req, res) {
		try {
			const { email, id } = req.user;

			if (!email) {
				res.status(400).json({
					message: 'Email not found in token',
				});
				return;
			}

			const user = await Users.findByPk(id, {
				include: [
					{
						model: Photo,
						as: 'avatar',
						attributes: ['path'],
					},
				],
			});

			if (!user) {
				res.status(404).json({
					message: 'User not found',
				});
				return;
			}
			res.status(200).json({ user });
		} catch (e) {
			console.error('Error fetching user profile:', e);
			res.status(500).json({
				message: e.message,
				status: 500,
			});
		}
	},
};
