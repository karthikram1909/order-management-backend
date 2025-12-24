require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const initCronJobs = require('./src/services/cronService');

const adminRoutes = require('./src/routes/adminRoutes');
const clientRoutes = require('./src/routes/clientRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());

// Database Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/project4')
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/client', clientRoutes);

// Serve Static Assets in Production
const path = require('path');
const fs = require('fs');

// Verify dist folder exists
const distPath = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(distPath)) {
    console.log('Serving static files from:', distPath);
    app.use(express.static(distPath, {
        setHeaders: (res, path) => {
            if (path.endsWith('.js')) {
                res.setHeader('Content-Type', 'application/javascript');
            }
        }
    }));
} else {
    console.log('Frontend build not found at:', distPath);
}

// Handle React Routing (SPA) - Return index.html for all non-API routes
app.get(/.*/, (req, res, next) => {
    // Don't intercept API routes
    if (req.url.startsWith('/api')) {
        return next();
    }

    // Check if index.html exists before trying to send it
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(503).send('System is starting up or Frontend build is missing. Please check logs.');
    }
});

// Init Cron
initCronJobs();

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
