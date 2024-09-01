const express = require('express');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
const { PORT } = require('./config/serverConfig') || 3005;

const app = express();

//app.use(express.json());

const limiter = rateLimit({
    windowMs: 2 * 60 * 1000, 
    max: 100 
});

app.use(morgan('combined')); // Logging
app.use(limiter); // Rate limiting

// Authentication Middleware for flightsService Service
app.use('/flightsService', async (req, res, next) => {
    console.log(req.headers['x-access-token']);
    try {
        const response = await axios.get('http://localhost:3001/api/v1/isAuthenticated', {
            headers: {
                'x-access-token': req.headers['x-access-token']
            }
        });
        console.log(response.data);
        if (response.data.success) {
            next();
        } else {
            return res.status(401).json({
                message: "Unauthorized User"
            });
        }
    } catch (error) {
        console.error(error); 
        return res.status(401).json({
            message: "Unauthorized User"
        });
    }
});


app.use('/flightsService', createProxyMiddleware({ 
    //target: 'https://flight-search-service.onrender.com', 
    target : `http://localhost:4001` ,
    changeOrigin: true,
    pathRewrite: { '^/flightsService': '/api/v1' }, 
    onError: (err, req, res) => {
        console.error('Proxy error:', err);
        res.status(500).json({ error: 'Proxy error', details: err.message });
    }
}));


app.use('/bookingService', async (req, res, next) => {
    try {
        const response = await axios.get('http://localhost:3001/api/v1/isAuthenticated', {
            headers: {
                'x-access-token': req.headers['x-access-token']
            }
        });
        console.log(response.data);
        if (response.data.success) {
            console.log(response.data.success);            
            next();
            console.log(`redirecting to booking Service`);            
        } else {
            return res.status(401).json({
                message: "Unauthorized User"
            });
        }
    } catch (error) {
        console.error(error); 
        return res.status(401).json({
            message: "Unauthorized User"
        });
    }
});

// Proxy Middleware for Flight Service
app.use('/bookingService', createProxyMiddleware({ 
    target: 'http://localhost:2001', 
    changeOrigin: true,
    pathRewrite: { '^/bookingService': '/api/v1' }, 
    onError: (err, req, res) => {
        console.error('Proxy error:', err);
        res.status(500).json({ error: 'Proxy error', details: err.message });
    }
}));

// Proxy Middleware for Flight Service
app.use('/authService', createProxyMiddleware({ 
    target: 'http://localhost:3001', 
    changeOrigin: true,
    pathRewrite: { '^/authService': '/api/v1' }, 
    onError: (err, req, res) => {
        console.error('Proxy error:', err);
        res.status(500).json({ error: 'Proxy error', details: err.message });
    }
}));


// Home Route
app.get('/home', (req, res) => {
    return res.json({ message: 'API Gateway IS LIVE check if auth service or flgiht service is down' });
});

// Start Server
app.listen(PORT, () => {
    console.log('Server started at Port', PORT);
});
