import sequelize from '../client/sequelize.mysql.js';
import { DataTypes, Model } from 'sequelize';
import Users from "./Users.js";
import Products from "./Products.js";

class Reviews extends Model {}

Reviews.init(
    {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },

        review: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        rating: {
            type: DataTypes.TINYINT.UNSIGNED,
            allowNull: false,
            validate: {
                min: 1,
                max: 5,
            },
        }
    },
    {
        sequelize,
        timestamps: true,
        modelName: 'reviews',
        tableName: 'reviews',

    }
);

Reviews.belongsTo(Users, { foreignKey: 'userId', onDelete: 'cascade' });
Reviews.belongsTo(Products, { foreignKey: 'productId', onDelete: 'cascade' });
Users.hasMany(Reviews, { foreignKey: 'userId', onDelete: 'cascade' });
Products.hasMany(Reviews, { foreignKey: 'productId', onDelete: 'cascade' });

export default Reviews;