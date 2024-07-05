const express = require('express');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');
const axios = require('axios');

const app = express();
const PORT = 3005;

// Rate Limiter Configuration
const limiter = rateLimit({
    windowMs: 2 * 60 * 1000, // 2 minutes
    max: 100 // Limit each IP to 100 requests per windowMs
});

// Middleware
app.use(morgan('combined')); // Logging
app.use(limiter); // Rate limiting

// Proxy Middleware for Flight Service
app.use('/flightsService', createProxyMiddleware({ 
    target: 'https://flight-search-service.onrender.com', 
    changeOrigin: true,
    pathRewrite: { '^/flightsService': '/api/v1' }, // Rewrite to match the target service's base path
    onError: (err, req, res) => {
        console.error('Proxy error:', err);
        res.status(500).json({ error: 'Proxy error', details: err.message });
    }
}));

// Authentication Middleware for Booking Service
app.use('/bookingservice', async (req, res, next) => {
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
        console.error(error); // Log the error for debugging
        return res.status(401).json({
            message: "Unauthorized User"
        });
    }
});

// Proxy Middleware for Booking Service
app.use('/bookingservice', createProxyMiddleware({
    target: 'http://localhost:3002', // Adjust to the actual target service for booking
    changeOrigin: true,
    pathRewrite: { '^/bookingservice': '/api/v1' }, // Adjust if necessary
    onError: (err, req, res) => {
        console.error('Proxy error:', err);
        res.status(500).json({ error: 'Proxy error', details: err.message });
    }
}));

// Home Route
app.get('/home', (req, res) => {
    return res.json({ message: 'OK' });
});

// Start Server
app.listen(PORT, () => {
    console.log('Server started at Port', PORT);
});
