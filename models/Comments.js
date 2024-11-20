import {DataTypes, Model} from 'sequelize';
import sequelize from '../client/sequelize.mysql.js';
import Users from "./Users.js";
import Reviews from "./Reviews.js";


class Comments extends Model {}

Comments.init(
    {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
        },

        comment: {
            type: DataTypes.TEXT,
            allowNull: false,
        }
    },
    {
        sequelize,
        timestamps: true,
        modelName: 'comments',
        tableName: 'comments',
    }
);

Comments.belongsTo(Users, { foreignKey: 'userId', onDelete: 'cascade' });
Comments.belongsTo(Reviews, { foreignKey: 'reviewId', onDelete: 'cascade' });
Users.hasMany(Comments, { foreignKey: 'userId', onDelete: 'cascade' });
Reviews.hasMany(Comments, { foreignKey: 'reviewId', onDelete: 'cascade' });

export default Comments;