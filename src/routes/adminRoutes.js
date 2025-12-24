const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyAdmin } = require('../middlewares/authMiddleware');

router.post('/login', adminController.login);
router.post('/refresh', adminController.refreshToken);

// Protected Routes
router.use(verifyAdmin);
router.get('/inquiries', adminController.getInquiries);
router.get('/orders', adminController.getOrders);

router.put('/order/:id/pricing', adminController.setPricing); // Set prices
router.put('/order/:id/payment', adminController.updatePaymentStatus); // Mark paid - Fixed path to match frontend usage
router.post('/order/:id/dispatch', adminController.dispatchOrder); // Fixed verb to POST or keep PUT? Controller uses updateOrderStatus. Frontend uses POST for dispatch.
router.post('/order/:id/deliver', adminController.deliverOrder);
router.post('/order/:id/cancel', adminController.cancelOrder);
router.put('/order/:id/extend-due-date', adminController.extendDueDate);

module.exports = router;
