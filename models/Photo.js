import { DataTypes, Model } from 'sequelize';
import sequelize from '../client/sequelize.mysql.js';

import Users from './Users.js';
import Stores from './Stores.js';
import Products from './Products.js';
class Photo extends Model {}

Photo.init(
	{
		id: {
			type: DataTypes.BIGINT.UNSIGNED,
			primaryKey: true,
			autoIncrement: true,
		},
		path: {
			type: DataTypes.STRING,
		},
	},
	{
		sequelize,
		modelName: 'photo',
		tableName: 'photo',
		timestamps: true,
	}
);

Users.hasMany(Photo, {
	foreignKey: 'userId',
	as: 'avatar',
	onDelete: 'cascade',
});
Photo.belongsTo(Users, {
	foreignKey: 'userId',
	onDelete: 'cascade',
});

Stores.hasMany(Photo, {
	foreignKey: 'storeId',
	as: 'storeLogo',
	onDelete: 'cascade',
});
Photo.belongsTo(Stores, {
	foreignKey: 'storeId',
	onDelete: 'cascade',
});

Products.hasMany(Photo, {
	foreignKey: 'productId',
	as: 'productImage',
	onDelete: 'cascade',
});
Photo.belongsTo(Products, {
	foreignKey: 'productId',
	onDelete: 'cascade',
});

export default Photo;
