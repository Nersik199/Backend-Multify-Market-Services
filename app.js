import './migrations.js';
import fs from 'fs';
import createError from 'http-errors';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';

const swaggerPath = path.resolve('./swagger-output.json');
const swaggerDocument = JSON.parse(fs.readFileSync(swaggerPath, 'utf-8'));

//router
import indexRouter from './routes/index.js';
import usersRouter from './routes/users.js';
const app = express();

const corsOptions = {
	origin: '*',
	methods: 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
	allowedHeaders: 'Content-Type, Authorization',
};

app.use(cors(corsOptions));

// view engine setup
app.set('views', path.join(path.resolve(), 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(path.resolve(), 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

const options = {
	explorer: true,
};

app.use(
	'/api-docs',
	swaggerUi.serve,
	swaggerUi.setup(swaggerDocument, options)
);
// catch 404 and forward to error handler
app.use((req, res, next) => {
	next(createError(404));
});

// error handler
app.use((err, req, res, next) => {
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.render('error');
});

export default app;
