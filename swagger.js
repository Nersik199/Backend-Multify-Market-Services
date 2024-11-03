import swaggerAutogen from 'swagger-autogen';
import path from 'path';

const doc = {
	info: {
		title: 'Api documentation',
		description:
			'This API provides access to various functionalities related to construction projects, including managing users, projects, and resources. For more details on the database structure, see [this Database Diagram](https://app.eraser.io/workspace/29K2erFoxrroWyOH4NQQ?origin=share).',
	},
	host: 'world-of-construction.onrender.com',
	schemes: ['https'],
};

const outputFile = './swagger-output.json';
const endpointsFiles = ['./routes/index.js'];

swaggerAutogen()(outputFile, endpointsFiles, doc).then(async () => {
	import(path.resolve('./routes/index.js')).then(module => {
		const app = module.default;
		// остальной код
	});
});
