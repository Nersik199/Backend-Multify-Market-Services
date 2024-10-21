import { DataTypes, Model } from 'sequelize';
import sequelize from '../client/sequelize.mysql.js';

import Users from './Users.js';

class Stores extends Model {}

Stores.init(
	{
		id: {
			type: DataTypes.BIGINT.UNSIGNED,
			primaryKey: true,
			autoIncrement: true,
		},
		name: {
			type: DataTypes.STRING(255),
			allowNull: false,
		},
		location: {
			type: DataTypes.JSON,
			allowNull: true,
		},
	},
	{
		sequelize,
		modelName: 'store',
		tableName: 'stores',
		timestamps: true,
	}
);

Users.hasMany(Stores, {
	foreignKey: 'ownerId',
	onDelete: 'cascade',
});
Stores.belongsTo(Users, {
	foreignKey: 'ownerId',
	onDelete: 'cascade',
});

export default Stores;
