import { DataTypes, Model } from 'sequelize';
import sequelize from '../client/sequelize.mysql.js';

import Stores from './Stores.js';

class Products extends Model {}

Products.init(
	{
		id: {
			type: DataTypes.BIGINT.UNSIGNED,
			primaryKey: true,
			autoIncrement: true,
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		size: {
			type: DataTypes.STRING,
		},
		price: {
			type: DataTypes.DECIMAL(10, 2),
			allowNull: false,
		},
		description: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		category: {
			type: DataTypes.STRING,
			allowNull: false,
		},
	},
	{
		sequelize,
		modelName: 'product',
		tableName: 'products',
		timestamps: true,
	}
);

Stores.hasMany(Products, {
	foreignKey: 'storeId',
	onDelete: 'cascade',
});
Products.belongsTo(Stores, {
	foreignKey: 'storeId',
	onDelete: 'cascade',
});

export default Products;
