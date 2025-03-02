import { v2 as cloudinary } from 'cloudinary';
import { v4 as uuid } from 'uuid';
import jwt from 'jsonwebtoken';
import Users from '../models/Users.js';
import Photo from '../models/Photo.js';

import { sendMail } from '../services/Mail.js';

export default {
	async registration(req, res) {
		try {
			const { firstName, lastName, email, password, gender, dateOfBirth } =
				req.body;
			const { file = null } = req;
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
				gender,
				dateOfBirth,
				email: email.toLowerCase(),
				password: password.trim(),
			});

			if (file) {
				await Photo.create({
					path: file.path,
					userId: user.id,
				});
			}

			const result = await Users.findByPk(user.id, {
				include: [
					{
						model: Photo,
						as: 'avatar',
						attributes: ['path'],
					},
				],
			});
			const activationKey = uuid().slice(0, 6);

			await Users.update(
				{
					activationKey,
				},
				{ where: { id: user.id } }
			);

			await sendMail({
				to: result.email,
				subject: 'welcome to world of construction',
				template: 'sendEmailCode',
				templateData: {
					fullName: ` ${user.firstName} ${user.lastName}`,
					code1: activationKey[0],
					code2: activationKey[1],
					code3: activationKey[2],
					code4: activationKey[3],
					code5: activationKey[4],
					code6: activationKey[5],
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
			const { key } = req.body;
			const user = await Users.findOne({
				where: { activationKey: key },
			});

			if (!user) {
				res.status(404).json({
					message: 'Invalid activation key',
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

	async resendActivationKey(req, res) {
		try {
			const { email } = req.body;

			const user = await Users.findOne({
				where: { email: email.toLowerCase() },
			});

			if (!user) {
				res.status(404).json({
					message: 'User not found',
				});
				return;
			}

			if (user.status === 'active') {
				res.status(400).json({
					message: 'Account already activated',
				});
				return;
			}

			const activationKey = uuid().slice(0, 6);

			await Users.update(
				{
					activationKey,
				},
				{ where: { id: user.id } }
			);

			await sendMail({
				to: user.email,
				subject: 'Resend Activation Key',
				template: 'sendEmailCode',
				templateData: {
					fullName: `${user.firstName} ${user.lastName}`,
					code1: activationKey[0],
					code2: activationKey[1],
					code3: activationKey[2],
					code4: activationKey[3],
					code5: activationKey[4],
					code6: activationKey[5],
				},
			});

			res.status(200).json({
				message: 'Activation key resent successfully',
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
				where: { email: email.toLowerCase() },
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

			if (user.role === 'superAdmin') {
				res.status(200).json({
					message: 'Login successful',
					token,
					superAdmin: true,
				});
				return;
			}

			res.status(200).json({
				message: 'Login successful',
				token,
				isAdmin: false,
				superAdmin: false,
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

	async updateProfile(req, res) {
		try {
			const { id } = req.user;
			const { file = null } = req;
			const { firstName, lastName, gender, dateOfBirth } = req.body;

			const user = await Users.findOne({
				where: { id },
				attributes: [
					'id',
					'email',
					'firstName',
					'lastName',
					'gender',
					'dateOfBirth',
				],
				include: [
					{
						model: Photo,
						as: 'avatar',
						attributes: ['id', 'path'],
					},
				],
			});

			if (file && file.path) {
				if (user.avatar.length === 0) {
					await Photo.create({
						path: file.path,
						userId: user.id,
					});
				}

				if (user.avatar.length > 0 && user.avatar[0].path) {
					const publicId = `avatar/${user.avatar[0].path
						.split('/')
						.pop()
						.split('.')
						.slice(0, -1)
						.join('.')}`;

					await cloudinary.uploader.destroy(publicId);

					await Photo.update(
						{ path: file.path },
						{ where: { userId: user.id } }
					);
				}
			}

			await Users.update(
				{
					firstName,
					lastName,
					gender,
					dateOfBirth,
				},
				{ where: { id } }
			);

			res.status(200).json({
				message: 'Profile updated successfully',
			});
		} catch (e) {
			console.error('Error updating profile:', e);
			res.status(500).json({
				message: e.message,
				status: 500,
			});
		}
	},
	async changePassword(req, res) {
		try {
			const { id } = req.user;
			const { newPassword } = req.body;

			await Users.update(
				{
					password: newPassword.trim(),
				},
				{ where: { id } }
			);

			res.status(200).json({
				message: 'Password updated successfully',
			});
		} catch (e) {
			console.error('Error updating password:', e);
			res.status(500).json({
				message: e.message,
				status: 500,
			});
		}
	},

	async forgotPassword(req, res) {
		try {
			const { email } = req.body;

			const user = await Users.findOne({ where: { email } });

			if (!user) {
				return res.status(404).json({ message: 'Wrong email address' });
			}

			if (user.status !== 'active') {
				return res
					.status(401)
					.json({ message: 'Please activate your account' });
			}

			const resetCode = uuid().slice(0, 6);

			await Users.update({ resetCode }, { where: { id: user.id } });

			await sendMail({
				to: user.email,
				subject: 'Update password account',
				template: 'sendEmailCode',
				templateData: {
					fullName: `${user.firstName} ${user.lastName}`,
					code1: resetCode[0],
					code2: resetCode[1],
					code3: resetCode[2],
					code4: resetCode[3],
					code5: resetCode[4],
					code6: resetCode[5],
				},
			});

			res.status(200).json({ message: 'Email sent successfully' });
		} catch (error) {
			console.log(error);
			res.status(500).json({ message: error.message });
		}
	},

	async resendCode(req, res) {
		try {
			const { email } = req.body;

			const user = await Users.findOne({ where: { email } });

			if (!user) {
				return res.status(404).json({ message: 'Wrong email address' });
			}

			if (user.status !== 'active') {
				return res
					.status(401)
					.json({ message: 'Please activate your account' });
			}

			const resetCode = uuid().slice(0, 6);

			await Users.update({ resetCode }, { where: { id: user.id } });

			await sendMail({
				to: user.email,
				subject: 'Resend password reset code',
				template: 'sendEmailCode',
				templateData: {
					fullName: `${user.firstName} ${user.lastName}`,
					code1: resetCode[0],
					code2: resetCode[1],
					code3: resetCode[2],
					code4: resetCode[3],
					code5: resetCode[4],
					code6: resetCode[5],
				},
			});

			res.status(200).json({ message: 'Reset code sent successfully' });
		} catch (error) {
			console.log(error);
			res.status(500).json({ message: error.message });
		}
	},

	async updatePassword(req, res) {
		try {
			const { newPassword, key } = req.body;

			const user = await Users.findOne({
				where: {
					resetCode: key,
				},
			});

			if (!user) {
				return res.status(400).json({ message: 'user not fud' });
			}

			if (!key) {
				return res.status(400).json({ message: 'key must be provided' });
			}

			await Users.update(
				{ password: newPassword.trim(), resetCode: null },
				{ where: { id: user.id } }
			);

			res.status(200).json({ message: 'Password updated successfully' });
		} catch (error) {
			console.log('Error:', error);
			res.status(500).json({ message: error.message });
		}
	},

	async deleteUser(req, res) {
		try {
			const { email } = req.body;
			console.log(11111111);

			if (!email) {
				return res.status(400).json({ message: 'Email is required' });
			}

			const user = await Users.findOne({ where: { email } });

			if (!user) {
				return res.status(404).json({ message: 'User not found' });
			}

			if (user.status !== 'pending') {
				return res
					.status(400)
					.json({ message: 'User has already activated their account' });
			}

			await Users.destroy({ where: { email } });
			return res.json({ message: 'User deleted successfully' });
		} catch (error) {
			console.error(error);
			res.status(500).json({ message: 'Server error' });
		}
	},
};
