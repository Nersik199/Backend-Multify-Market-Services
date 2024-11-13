import { DataTypes, Model } from 'sequelize';
import sequelize from '../client/sequelize.mysql.js';

import Users from './Users.js';

class Cards extends Model { }

Cards.init(
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
        quantity: {
            type: DataTypes.NUMBER,
            allowNull: false,
        }
    },
    {
        sequelize,
        modelName: 'cards',
        tableName: 'cards',
        timestamps: true,
    }
);

Users.hasMany(Cards, {
    foreignKey: 'userId',
    onDelete: 'cascade',
});

export default Cards;