import sequelize from "../client/sequelize.mysql.js";
import { DataTypes, Model } from "sequelize";

class AdminNotification extends Model {}

AdminNotification.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    storeId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      defaultValue: null,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    productId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      defaultValue: null,
    },
    productName: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    productImage: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    timestamps: true,
    modelName: "adminNotification",
    tableName: "adminNotifications",
  }
);

export default AdminNotification;
