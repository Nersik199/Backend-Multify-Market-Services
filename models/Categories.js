import { DataTypes, Model } from 'sequelize';
import sequelize from '../client/sequelize.mysql.js';

class Categories extends Model {}

Categories.init(
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
	},
	{
		sequelize,
		modelName: 'category',
		tableName: 'categories',
		timestamps: true,
	}
);

export default Categories;
