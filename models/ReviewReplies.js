import sequelize from '../client/sequelize.mysql.js';
import { DataTypes, Model } from 'sequelize';
import Users from './Users.js';
import Reviews from './Reviews.js';

class ReviewReplies extends Model {}

ReviewReplies.init(
	{
		id: {
			type: DataTypes.BIGINT.UNSIGNED,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true,
		},
		reply: {
			type: DataTypes.TEXT,
			allowNull: false,
		},
	},
	{
		sequelize,
		timestamps: true,
		modelName: 'reviewReplies',
		tableName: 'reviewReplies',
	}
);

ReviewReplies.belongsTo(Users, { foreignKey: 'sellerId', onDelete: 'cascade' });
ReviewReplies.belongsTo(Reviews, {
	foreignKey: 'reviewId',
	onDelete: 'cascade',
});
Users.hasMany(ReviewReplies, { foreignKey: 'sellerId', onDelete: 'cascade' });
Reviews.hasOne(ReviewReplies, { foreignKey: 'reviewId', onDelete: 'cascade' });

export default ReviewReplies;
