import Users from './models/Users.js';
import Stores from './models/Stores.js';
import Products from './models/Products.js';
import Categories from './models/Categories.js';
import ProductCategories from './models/ProductCategories.js';
import Photo from './models/Photo.js';

const models = [Users, Stores, Products, Categories, ProductCategories, Photo];

(async () => {
	for (const model of models) {
		await model.sync({ alter: true });
		console.log(model.name, 'synced');
	}
})();
