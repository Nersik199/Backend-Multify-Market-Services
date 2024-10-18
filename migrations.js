
import Photo from './models/Photo.js';
import Users from './models/Users.js';
const models = [Users, Photo];

(async () => {
	for (const model of models) {
		await model.sync({ alter: true });
		console.log(model.name, `created table ;`);
	}
})();
