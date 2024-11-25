import Users from './models/Users.js';
import Stores from './models/Stores.js';
import Products from './models/Products.js';
import Categories from './models/Categories.js';
import ProductCategories from './models/ProductCategories.js';
import Photo from './models/Photo.js';
import StoreAdmin from './models/StoreAdmin.js';
import Reviews from './models/Reviews.js';
import Comments from './models/Comments.js';


import Cards from './models/Cards.js';


const models = [
	Users,
	Stores,
	StoreAdmin,
	Products,
	Categories,
	ProductCategories,
	Photo,
	Reviews,

	Comments,
	Cards

	Comments

];

(async () => {
	for (const model of models) {
		await model.sync({ alter: true });
		console.log(model.name, 'synced');
	}
})();
