import express from "express";
import controllers from "../controllers/controllers.AdminNotification.js";
import checkToken from "../middleware/checkToken.js";

const router = express.Router();

router.patch(
  "/:notificationId/read",
  checkToken,
  controllers.markNotificationAsRead
);
router.get("/unread", checkToken, controllers.getUnreadNotifications);
export default router;
