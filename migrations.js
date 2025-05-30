import Users from "./models/Users.js";
import Notification from "./models/Notification.js";
import Stores from "./models/Stores.js";
import Products from "./models/Products.js";
import Categories from "./models/Categories.js";
import ProductCategories from "./models/ProductCategories.js";
import Photo from "./models/Photo.js";
import StoreAdmin from "./models/StoreAdmin.js";
import Reviews from "./models/Reviews.js";
import ReviewReplies from "./models/ReviewReplies.js";
import Cards from "./models/Cards.js";
import Payments from "./models/Payments.js";
import Discounts from "./models/Discounts.js";
import AdminNotification from "./models/AdminNotification.js";

const models = [
  Users,
  Notification,
  Stores,
  StoreAdmin,
  Products,
  Categories,
  ProductCategories,
  Photo,
  Reviews,
  ReviewReplies,
  Cards,
  Payments,
  Discounts,
  AdminNotification,
];

(async () => {
  for (const model of models) {
    await model.sync({ alter: true });
    console.log(model.name, "synced");
  }
})();
