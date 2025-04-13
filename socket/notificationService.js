import Notification from "../models/Notification.js";
import AdminNotification from "../models/AdminNotification.js";

export default {
  sendReviewReplyNotification(userId, reply, seller, product) {
    if (global.io) {
      global.io.to(`user_${userId}`).emit("review_reply", {
        message: "The seller has replied to your review!",
        reply,
        seller: {
          id: seller.id,
          name: `${seller.firstName} ${seller.lastName}`,
          email: seller.email,
        },
        product,
      });

      Notification.create({
        userId,
        message: reply,
        productId: product.id,
        productName: product.name,
        productImage: product.path,
      })
        .then(() => {
          console.log("Notification successfully created");
        })
        .catch((err) => {
          console.error("Error creating notification:", err);
        });
    } else {
      console.error("Socket.io is not initialized");
    }
  },

  sendNewReviewNotification(admins, review, product) {
    if (global.io) {
      admins.forEach((admin) => {
        global.io.to(`admin_${admin.userId}`).emit("new_review", {
          message: "A new review has been posted for one of your products!",
          review: {
            id: review.id,
            content: review.review,
            rating: review.rating,
            userId: review.userId,
          },
          product: {
            id: product.id,
            name: product.name,
            image: product.path,
          },
        });
      });

      AdminNotification.create({
        storeId: product.storeId,
        message: review.review,
        productId: product.id,
        productName: product.name,
        productImage: product.path,
      })
        .then(() => {
          console.log("Admin notification successfully created");
        })
        .catch((err) => {
          console.error("Error creating admin notification:", err);
        });
    } else {
      console.error("Socket.io is not initialized");
    }
  },
};
