import sequelize from '../client/sequelize.mysql.js';
import { DataTypes, Model } from 'sequelize';
import Users from './Users.js';

class Notification extends Model {}

Notification.init(
	{
		id: {
			type: DataTypes.BIGINT.UNSIGNED,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true,
		},
		userId: {
			type: DataTypes.BIGINT.UNSIGNED,
			allowNull: false,
		},
		message: {
			type: DataTypes.TEXT,
			allowNull: false,
		},
		productId: {
			type: DataTypes.BIGINT.UNSIGNED,
			allowNull: true,
		},
		productName: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		productImage: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		isRead: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
	},
	{
		sequelize,
		timestamps: true,
		modelName: 'notification',
		tableName: 'notifications',
	}
);

Notification.belongsTo(Users, { foreignKey: 'userId', onDelete: 'cascade' });
Users.hasMany(Notification, { foreignKey: 'userId', onDelete: 'cascade' });

export default Notification;
