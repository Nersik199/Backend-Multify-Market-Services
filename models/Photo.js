import path from 'path';
import fs from 'fs/promises';
import { DataTypes, Model } from 'sequelize';
import sequelize from '../client/sequelize.mysql.js';

import Users from './Users.js';

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

export default Photo;
