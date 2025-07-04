import md5 from 'md5';
import { DataTypes, Model } from 'sequelize';
import sequelize from '../client/sequelize.mysql.js';
import jwt from 'jsonwebtoken';
const { USER_PASSWORD_SECRET, JWT_TOKEN } = process.env;

class Users extends Model {
	static hashPassword(password) {
		return md5(md5(password) + USER_PASSWORD_SECRET);
	}
	static createToken(payload) {
		const { id, email } = payload;
		return jwt.sign({ id, email }, JWT_TOKEN, {
			expiresIn: '30d',
		});
	}
}

Users.init(
	{
		id: {
			type: DataTypes.BIGINT.UNSIGNED,
			primaryKey: true,
			autoIncrement: true,
		},
		firstName: {
			type: DataTypes.STRING(255),
			allowNull: false,
		},
		lastName: {
			type: DataTypes.STRING(255),
			allowNull: false,
		},
		gender: {
			type: DataTypes.STRING,
			enum: ['male', 'female'],
			defaultValue: 'male',
		},
		dateOfBirth: {
			type: DataTypes.DATE,
			defaultValue: null,
		},
		password: {
			type: DataTypes.STRING(255),
			allowNull: false,
			get() {
				return '******';
			},
			set(value) {
				this.setDataValue('password', Users.hashPassword(value));
			},
		},
		email: {
			type: DataTypes.STRING(255),
			allowNull: false,
		},
		role: {
			type: DataTypes.ENUM('admin', 'superAdmin', 'user'),
			allowNull: false,
			defaultValue: 'user',
		},
		activationKey: {
			type: DataTypes.STRING,
		},
		status: {
			type: DataTypes.STRING,
			defaultValue: 'pending',
		},
		resetCode: {
			type: DataTypes.STRING,
			defaultValue: null,
		},
		address: {
			type: DataTypes.STRING(500),
			allowNull: true,
			defaultValue: null,
		},
	},
	{
		sequelize,
		timestamps: true,
		modelName: 'user',
		tableName: 'users',
		indexes: [
			{
				unique: true,
				fields: ['email'],
			},
		],
	}
);

export default Users;
