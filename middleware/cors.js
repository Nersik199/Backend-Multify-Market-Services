function corsMiddleware(req, res, next) {
	try {
		const allowedOrigins = ['https://world-of-construction.onrender.com'];
		const origin = req.headers.origin;

		res.setHeader(
			'Access-Control-Allow-Methods',
			'GET, POST, PUT, DELETE, PATCH, OPTIONS'
		);

		if (allowedOrigins.includes(origin)) {
			res.setHeader('Access-Control-Allow-Origin', origin);
		} else {
			console.warn(`Blocked CORS request from origin: ${origin}`);
		}

		res.setHeader(
			'Access-Control-Allow-Headers',
			'Content-Type, Authorization'
		);

		if (req.method === 'OPTIONS') {
			res.status(200).send('Allow: GET, POST, PUT, DELETE, PATCH, OPTIONS');
			return;
		}

		next();
	} catch (error) {
		console.error(error);
		next(error);
	}
}

export default corsMiddleware;
