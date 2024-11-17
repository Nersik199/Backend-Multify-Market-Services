import { DataTypes, Model } from 'sequelize';
import sequelize from '../client/sequelize.mysql.js';

import Products from './Products.js';
import Categories from './Categories.js';

class ProductCategories extends Model {}

ProductCategories.init(
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
		categoryId: {
			type: DataTypes.BIGINT.UNSIGNED,
			allowNull: false,
		},
	},
	{
		sequelize,
		modelName: 'productCategories',
		tableName: 'productCategories',
		timestamps: true,
	}
);

ProductCategories.belongsTo(Products, {
	foreignKey: 'productId',
	onDelete: 'cascade',
});
ProductCategories.belongsTo(Categories, {
	foreignKey: 'categoryId',
	onDelete: 'cascade',
});

export default ProductCategories;
