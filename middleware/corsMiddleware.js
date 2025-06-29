const corsMiddleware = (req, res, next) => {
    const allowedOrigins = [
        process.env.CLIENT_URI_1, 
        process.env.CLIENT_URI_2 
    ];

    const origin = req.headers.origin;

    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
        console.warn(`Origin ${origin} not allowed by CORS.`);
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }

    next();
};

export default corsMiddleware;
