import { v2 as cloudinary } from "cloudinary";
import { Op, Sequelize } from "sequelize";

// Models
import Photo from "../models/Photo.js";
import Users from "../models/Users.js";
import Stores from "../models/Stores.js";
import StoreAdmin from "../models/StoreAdmin.js";
import Payments from "../models/Payments.js";
import Products from "../models/Products.js";

export default {
  createStore: async (req, res) => {
    try {
      const { file = null } = req;
      const { name, location } = req.body;
      const { id } = req.user;

      const user = await Users.findByPk(id);
      if (user.role !== "superAdmin") {
        return res.status(401).json({
          message: "You are not authorized to create a store",
        });
      }

      const storeCreate = await Stores.create({
        name: name.trim().toLowerCase(),
        location,
        ownerId: user.id,
      });

      if (!storeCreate) {
        if (file && file.public_id) {
          await cloudinary.uploader.destroy(file.public_id);
        }
        return res.status(500).json({
          message: "Error creating store",
        });
      }

      if (file) {
        await Photo.create({
          storeId: storeCreate.id,
          path: file.path,
        });
      }

      const store = await Stores.findByPk(storeCreate.id, {
        include: [
          {
            model: Photo,
            as: "storeLogo",
            attributes: ["path"],
          },
        ],
      });

      res.status(201).json({
        store,
        message: "Store created successfully",
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Error creating store",
      });
    }
  },

  getStores: async (req, res) => {
    try {
      const stores = await Stores.findAll({
        attributes: ["id", "name", "location"],
        include: [
          {
            model: Photo,
            as: "storeLogo",
            attributes: ["path"],
          },
        ],
      });
      res.status(200).json({
        stores,
        message: "Stores fetched successfully",
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Error fetching stores",
      });
    }
  },

  setupUserStore: async (req, res) => {
    try {
      const { id } = req.user;
      const { email, storeName } = req.body;
      const admin = await Users.findByPk(id);

      if (!admin || admin.role !== "superAdmin") {
        return res.status(401).json({
          message: "You are not authorized to create a store",
        });
      }

      const user = await Users.findOne({
        where: { email: email.trim().toLowerCase() },
      });
      const store = await Stores.findOne({
        where: { name: storeName.trim().toLowerCase() },
      });

      if (!user || !store) {
        return res.status(404).json({
          message: "User or store not found",
        });
      }

      const storeAdmin = await StoreAdmin.findOne({
        where: { userId: user.id },
      });

      if (storeAdmin) {
        return res.status(409).json({
          message: "User already has a store",
        });
      }

      await StoreAdmin.create({
        userId: user.id,
        storeId: store.id,
      });

      res.status(201).json({
        message: "User and store created successfully",
      });
    } catch (error) {
      console.error("Error in setupUserStore:", error);
      res.status(500).json({
        message: "Error creating user and store",
      });
    }
  },

  getStatistics: async (req, res) => {
    try {
      const { storeId } = req.params;
      let { startDate, endDate, groupBy = "day" } = req.query;
      const { id } = req.user;

      const user = await Users.findByPk(id);
      if (!user || user.role !== "superAdmin") {
        return res.status(401).json({
          message: "You are not authorized to view statistics",
        });
      }

      if (!storeId) {
        return res.status(400).json({
          message: "Please provide a storeId in the request parameters",
        });
      }

      if (!startDate || !endDate) {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayOfMonth = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0
        );

        startDate = firstDayOfMonth.toISOString().split("T")[0];
        endDate = lastDayOfMonth.toISOString().split("T")[0];
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
          message: "Invalid date format. Please use YYYY-MM-DD",
        });
      }

      let groupInterval;
      switch (groupBy) {
        case "year":
          groupInterval = Sequelize.literal(
            "DATE_FORMAT(createdAt, '%Y-01-01')"
          );
          break;
        case "month":
          groupInterval = Sequelize.literal(
            "DATE_FORMAT(createdAt, '%Y-%m-01')"
          );
          break;
        case "day":
        default:
          groupInterval = Sequelize.literal(
            "DATE_FORMAT(createdAt, '%Y-%m-%d')"
          );
          break;
      }

      const productCount = await Products.count({
        where: {
          storeId,
        },
      });

      if (!productCount) {
        return res.status(404).json({
          message: "No products found for this store",
        });
      }

      const salesStatistics = await Payments.findAll({
        attributes: [
          [groupInterval, "interval"],
          [Sequelize.fn("SUM", Sequelize.col("amount")), "totalRevenue"],
          [Sequelize.fn("COUNT", Sequelize.col("id")), "totalSales"],
        ],
        where: {
          storeId,
          createdAt: {
            [Op.between]: [start, end],
          },
        },
        group: ["interval"],
        order: [groupInterval],
      });

      if (!salesStatistics.length) {
        return res.status(200).json({
          storeId,
          totalRevenue: 0,
          totalSales: 0,
          totalOrders: 0,
          productCount: 0,
          statistics: [],
          message: "No sales statistics found for this store and period",
        });
      }

      const totalRevenue = await Payments.sum("amount", {
        where: {
          storeId,
        },
      });

      const totalSales = await Payments.sum("amount", {
        where: {
          storeId,
          createdAt: {
            [Op.between]: [start, end],
          },
        },
      });

      const totalOrders = await Payments.count({
        where: {
          storeId,
          status: "paid",
          createdAt: {
            [Op.between]: [start, end],
          },
        },
        distinct: true,
        col: "id",
      });

      const statistics = salesStatistics.map((stat) => ({
        interval: stat.dataValues.interval,
        totalRevenue: parseFloat(stat.dataValues.totalRevenue),
        totalSales: parseInt(stat.dataValues.totalSales, 10),
      }));

      res.status(200).json({
        storeId,
        totalRevenue: totalRevenue || 0,
        totalSales: totalSales || 0,
        totalOrders: totalOrders || 0,
        productCount: productCount || 0,
        statistics,
        message: "Sales statistics for the store fetched successfully",
      });
    } catch (error) {
      console.error("Error fetching sales statistics for the store:", error);
      res.status(500).json({
        message: "Error fetching sales statistics for the store",
      });
    }
  },

  getBuyers: async (req, res) => {
    try {
      const { storeId } = req.params;
      const { startDate, endDate } = req.query;
      const { id } = req.user;
      const user = await Users.findByPk(id);
      if (!user || user.role !== "superAdmin") {
        return res.status(401).json({
          message: "You are not authorized to view statistics",
        });
      }
      if (!storeId) {
        return res.status(400).json({
          message: "Please provide a storeId in the request parameters",
        });
      }

      let start = startDate
        ? new Date(startDate)
        : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      let end = endDate
        ? new Date(endDate)
        : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
          message: "Invalid date format. Please use YYYY-MM-DD",
        });
      }

      const buyersData = await Payments.findAll({
        attributes: [
          "userId",
          [Sequelize.fn("SUM", Sequelize.col("amount")), "totalSpent"],
          [Sequelize.fn("SUM", Sequelize.col("quantity")), "totalQuantity"],
        ],
        where: {
          storeId,
          createdAt: { [Op.between]: [start, end] },
        },
        group: ["userId"],
        raw: true,
      });

      if (!buyersData.length) {
        return res.status(200).json({
          storeId,
          buyers: [],
          message: "No buyers found for this store and period",
        });
      }

      const userIds = buyersData.map((u) => u.userId);

      if (!userIds.length) {
        return res.status(200).json({
          storeId,
          buyers: [],
          message: "No buyers found for this period",
        });
      }

      const users = await Users.findAll({
        attributes: ["id", "email"],
        where: { id: userIds },
        include: {
          model: Photo,
          as: "avatar",
          attributes: ["path"],
        },
        raw: true,
      });

      const buyers = users.map((user) => {
        const buyerData = buyersData.find((b) => b.userId === user.id);
        return {
          id: user.id,
          email: user.email,
          avatar: user["avatar.path"] ? user["avatar.path"] : null,
          totalSpent: buyerData ? parseFloat(buyerData.totalSpent) : 0,
          totalQuantity: buyerData ? parseInt(buyerData.totalQuantity) : 0,
        };
      });

      res.status(200).json({
        storeId,
        buyers,
        message: "Buyers fetched successfully",
      });
    } catch (error) {
      console.error("Error fetching buyers for the store:", error);
      res.status(500).json({
        message: "Error fetching buyers for the store",
      });
    }
  },
};
