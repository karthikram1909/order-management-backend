const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const { verifyClient } = require('../middlewares/authMiddleware');

// Assuming Client Auth for now is open or simple token. 
// For "OTP/mobile-based", we'd have a login route too, but spec didn't ask for Client Login API explicitly, 
// just "Client uses OTP". I will skip auth middleware for client routes for simplicity of this scaffold 
// or assume global middleware if needed.

// Product Catalog
router.get('/products', clientController.getProducts);

// Auth
router.post('/login', clientController.login);
router.get('/orders', verifyClient, clientController.getHistory);

// Legacy
// router.post('/auth/otp', clientController.requestOtp);
// router.post('/auth/verify', clientController.verifyOtp);

router.post('/inquiry', clientController.submitInquiry);
router.get('/order/:id', clientController.getOrder);
router.put('/order/:id/modify', clientController.modifyOrder);
router.post('/order/:id/confirm', clientController.confirmOrder);
router.post('/order/:id/received', clientController.confirmDelivery);
router.post('/order/:id/feedback', clientController.submitFeedback);

module.exports = router;
