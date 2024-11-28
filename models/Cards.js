import { DataTypes, Model } from 'sequelize';
import sequelize from '../client/sequelize.mysql.js';

import Users from './Users.js';
import Products from './Products.js';

class Cards extends Model {}

Cards.init(
	{
		id: {
			type: DataTypes.BIGINT.UNSIGNED,
			primaryKey: true,
			autoIncrement: true,
		},
		productId: {
			type: DataTypes.BIGINT.UNSIGNED,
			allowNull: false,
		},
		quantity: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false,
		},
	},
	{
		sequelize,
		modelName: 'cards',
		tableName: 'cards',
		timestamps: true,
	}
);

Users.hasMany(Cards, {
	foreignKey: 'userId',
	onDelete: 'cascade',
});

Cards.belongsTo(Products, {
	foreignKey: 'productId',
	as: 'product',
});

export default Cards;
