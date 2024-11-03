import { DataTypes, Model } from 'sequelize';
import sequelize from '../client/sequelize.mysql.js';

import Users from './Users.js';

class StoreAdmin extends Model {}

StoreAdmin.init(
	{
		id: {
			type: DataTypes.BIGINT.UNSIGNED,
			primaryKey: true,
			autoIncrement: true,
		},
		storeId: {
			type: DataTypes.BIGINT.UNSIGNED,
			allowNull: false,
		},
		userId: {
			type: DataTypes.BIGINT.UNSIGNED,
			allowNull: false,
		},
	},
	{
		sequelize,
		modelName: 'storeAdmin',
		tableName: 'storeAdmins',
		timestamps: true,
	}
);

StoreAdmin.belongsTo(Users, {
	foreignKey: 'userId',
	onDelete: 'CASCADE',
});
Users.hasOne(StoreAdmin, {
	foreignKey: 'userId',
	onDelete: 'CASCADE',
});

export default StoreAdmin;
