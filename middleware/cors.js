function corsMiddleware(req, res, next) {
  try {
    const { origin = "*", method } = req.headers;

    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, PATCH, OPTIONS",
    );
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("X-Powered-By", "militosyan13@gmail.com");

    if (method === "OPTIONS") {
      res.status(200).send("Allow: GET, POST, PUT, DELETE, PATCH, OPTIONS");
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
}

export default corsMiddleware;
