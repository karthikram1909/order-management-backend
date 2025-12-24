const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'Access Denied' });

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Invalid Token', error: err.message });
    }
};

const verifyAdmin = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.user && req.user.role === 'ADMIN') {
            next();
        } else {
            res.status(403).json({ message: 'Admin Access Required' });
        }
    });
};

const verifyClient = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.user && req.user.role === 'CLIENT') {
            next();
        } else {
            res.status(403).json({ message: 'Client Access Required' });
        }
    });
};

module.exports = { verifyToken, verifyAdmin, verifyClient };
