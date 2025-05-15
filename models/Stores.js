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
		videoUrl: {
			type: DataTypes.STRING(255),
			allowNull: false,
		},
		webSiteUrl: {
			type: DataTypes.STRING(255),
			allowNull: false,
		},
		about: {
			type: DataTypes.TEXT(),
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

// Building materials
// Construction chemicals
// Electrical equipment
// Insulation materials
// Finishing materials
// Plumbing
// Ventilation and air conditioning
// Windows and doors
// Power tools
// Hand tools
