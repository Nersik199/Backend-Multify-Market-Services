import { DataTypes, Model } from 'sequelize';
import sequelize from '../client/sequelize.mysql.js';
import Users from './Users.js';
import Products from './Products.js';

class Payments extends Model {}

Payments.init(
	{
		id: {
			type: DataTypes.BIGINT.UNSIGNED,
			primaryKey: true,
			autoIncrement: true,
		},
		userId: {
			type: DataTypes.BIGINT.UNSIGNED,
			allowNull: false,
		},
		productId: {
			type: DataTypes.BIGINT.UNSIGNED,
			allowNull: false,
		},
		amount: {
			type: DataTypes.DECIMAL(10, 2),
			allowNull: false,
		},
		status: {
			type: DataTypes.ENUM('paid', 'pending', 'failed', 'received'),
			allowNull: false,
			defaultValue: 'pending',
		},
		transactionId: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		quantity: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false,
		},
		address: {
			type: DataTypes.STRING,
		},
		deliveryDate: {
			type: DataTypes.DATE,
		},
		storeId: {
			type: DataTypes.BIGINT.UNSIGNED,
			allowNull: false,
		},
	},
	{
		sequelize,
		modelName: 'payments',
		tableName: 'payments',
		timestamps: true,
	}
);

Payments.belongsTo(Users, { foreignKey: 'userId', onDelete: 'cascade' });
Users.hasMany(Payments, { foreignKey: 'userId', onDelete: 'cascade' });

Payments.belongsTo(Products, { foreignKey: 'productId', onDelete: 'cascade' });
Products.hasMany(Payments, { foreignKey: 'productId', onDelete: 'cascade' });

export default Payments;
