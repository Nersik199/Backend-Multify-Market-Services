import { DataTypes, Model } from 'sequelize';
import sequelize from '../client/sequelize.mysql.js';
import Products from './Products.js';
import Stores from './Stores.js';
class Discounts extends Model {}

Discounts.init(
	{
		id: {
			type: DataTypes.BIGINT.UNSIGNED,
			primaryKey: true,
			autoIncrement: true,
		},
		storeId: {
			type: DataTypes.BIGINT.UNSIGNED,
			allowNull: false,
			references: {
				model: Stores,
				key: 'id',
			},
			onDelete: 'CASCADE',
		},
		productId: {
			type: DataTypes.BIGINT.UNSIGNED,
			allowNull: false,
			references: {
				model: Products,
				key: 'id',
			},
			onDelete: 'CASCADE',
		},
		discountPercentage: {
			type: DataTypes.DECIMAL(5, 2),
			allowNull: false,
		},
		discountPrice: {
			type: DataTypes.DECIMAL(10, 2),
			allowNull: false,
		},
		startDate: {
			type: DataTypes.DATE,
			allowNull: false,
		},
		endDate: {
			type: DataTypes.DATE,
			allowNull: false,
		},
	},
	{
		sequelize,
		modelName: 'discounts',
		tableName: 'discounts',
		timestamps: true,
	}
);

Products.hasOne(Discounts, {
	foreignKey: 'productId',
	onDelete: 'CASCADE',
});
Discounts.belongsTo(Products, {
	foreignKey: 'productId',
	onDelete: 'CASCADE',
});

Stores.hasMany(Discounts, {
	foreignKey: 'storeId',
	onDelete: 'CASCADE',
});
Discounts.belongsTo(Stores, {
	foreignKey: 'storeId',
	onDelete: 'CASCADE',
});

export default Discounts;
