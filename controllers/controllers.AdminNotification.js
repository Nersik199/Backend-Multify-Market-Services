import AdminNotification from "../models/AdminNotification.js";
import StoreAdmin from "../models/StoreAdmin.js";
import Users from "../models/Users.js";

export default {
  async markNotificationAsRead(req, res) {
    try {
      const { notificationId } = req.params;

      const { id } = req.user;

      const admin = await Users.findOne({
        where: { id },
      });

      if (admin.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (!notificationId) {
        return res.status(400).json({ message: "Notification ID is required" });
      }

      const notification = await AdminNotification.findByPk(notificationId);

      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }

      notification.isRead = true;
      await notification.save();

      res.status(200).json({ message: "Notification marked as read" });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Internal server error", error: error.message });
    }
  },

  async getUnreadNotifications(req, res) {
    try {
      const userId = req.user.id;

      const admin = await Users.findOne({
        where: { id: userId },
      });

      if (admin.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }

      const store = await StoreAdmin.findOne({
        where: { userId },
      });

      const notifications = await AdminNotification.findAll({
        where: { storeId: store.storeId, isRead: false },
        attributes: [
          "id",
          "message",
          "createdAt",
          "isRead",
          "productId",
          "productName",
          "productImage",
        ],
        order: [["createdAt", "DESC"]],
      });

      res.status(200).json({ notifications });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Internal server error", error: error.message });
    }
  },
};
