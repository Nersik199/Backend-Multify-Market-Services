import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import { readFile } from 'fs/promises';

dotenv.config();

const { 
	DB_HOST,
	DB_DATABASE,
	DB_USER,
	DB_PASSWORD,
	DB_PORT,
	DB_KEY } =
	process.env;

const dbConfig = {
	host: DB_HOST,
	port: DB_PORT,
	dialect: 'mysql',
	logging: false,
	dialectOptions: {
		ssl: {
			require: true,
			rejectUnauthorized: false,
			ca: await readFile(DB_KEY),
		},
	},
};

const sequelize = new Sequelize(DB_DATABASE, DB_USER, DB_PASSWORD, dbConfig);

(async () => {
	try {
		await sequelize.authenticate();
		console.log('Connection has been established successfully.');
	} catch (err) {
		console.error('Unable to connect to the database:', err);
	}
})();

export default sequelize;
