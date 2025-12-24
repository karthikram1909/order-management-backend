const Order = require('../models/Order');
const Client = require('../models/Client');
const orderService = require('../services/orderService');
const CatalogItem = require('../models/CatalogItem');
const jwt = require('jsonwebtoken');

// Helper to generate OTP
const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

exports.login = async (req, res) => {
    try {
        const { name, mobileNumber } = req.body;
        if (!mobileNumber) return res.status(400).json({ message: 'Mobile Number required' });

        let client = await Client.findOne({ mobileNumber });
        if (!client) {
            if (!name) return res.status(400).json({ message: 'Name required for new registration' });
            client = new Client({ mobileNumber, name, address: 'Pending' });
            await client.save();
        }

        const token = jwt.sign({ _id: client._id, role: 'CLIENT' }, process.env.JWT_SECRET, { expiresIn: '30d' });
        res.json({ token, client });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getHistory = async (req, res) => {
    try {
        // req.user is set by verifyClient middleware
        const orders = await Order.find({ clientId: req.user._id }).sort({ createdAt: -1 }).populate('items.itemId');
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Kept for backward compat if needed, but Login replaces it
exports.requestOtp = async (req, res) => {
    // ... Legacy/unused now ...
    res.status(410).json({ message: 'Use /login' });
};

exports.verifyOtp = async (req, res) => {
    try {
        const { mobileNumber, otp } = req.body;
        console.log(`[VERIFY] Attempt for ${mobileNumber} with OTP ${otp}`);

        const client = await Client.findOne({ mobileNumber });

        if (!client) {
            console.log(`[VERIFY] Client not found for ${mobileNumber}`);
            return res.status(400).json({ message: 'Invalid or Expired OTP' });
        }

        console.log(`[VERIFY] Found client. Stored OTP: ${client.otp}, Expires: ${client.otpExpires}`);

        if (client.otp !== otp) {
            console.log(`[VERIFY] OTP Mismatch. Expected ${client.otp}, Got ${otp}`);
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        if (client.otpExpires < Date.now()) {
            console.log(`[VERIFY] OTP Expired.`);
            return res.status(400).json({ message: 'Expired OTP' });
        }

        // Clear OTP
        client.otp = undefined;
        client.otpExpires = undefined;
        await client.save();

        const token = jwt.sign({ _id: client._id, role: 'CLIENT' }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, client });
    } catch (err) {
        console.error('[VERIFY] Error:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.getProducts = async (req, res) => {
    try {
        const products = await CatalogItem.find({ isActive: true });
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.submitInquiry = async (req, res) => {
    try {
        const { name, mobileNumber, items } = req.body;

        // Validation
        if (!name || !mobileNumber || !items || items.length === 0) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // 1. Find or Create Client
        let client = await Client.findOne({ mobileNumber });
        if (!client) {
            // Create new client Profile
            client = new Client({
                name,
                mobileNumber,
                address: 'Address Pending' // Placeholder as per simple flow
            });
            await client.save();
        }

        // 2. Create Order
        const order = new Order({
            clientId: client._id,
            items,
            orderStatus: 'NEW_INQUIRY',
            auditLogs: [{ action: 'CREATED', changedBy: 'CLIENT', detail: 'Inquiry submitted' }]
        });

        await order.save();
        res.status(201).json(order);
    } catch (err) {
        console.error('[SUBMIT_INQUIRY_ERROR]', err);
        res.status(500).json({ error: err.message });
    }
};

exports.getOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('items.itemId').populate('clientId');
        if (!order) return res.status(404).json({ message: 'Order not found' });
        res.json(order);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.modifyOrder = async (req, res) => {
    try {
        const { items } = req.body;
        const order = await orderService.modifyOrderItems(req.params.id, items, 'CLIENT');
        res.json(order);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.confirmOrder = async (req, res) => {
    try {
        const order = await orderService.updateOrderStatus(req.params.id, 'ORDER_CONFIRMED', 'CLIENT', 'Client confirmed order');
        res.json(order);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.confirmDelivery = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        order.deliveryStatus = 'CONFIRMED';
        // Maybe update main status too?
        // "DELIVERED" is usually set by driver/admin. "CONFIRMED" is by client?
        // Spec: "POST /api/order/:id/received -> confirm delivery"

        // Let's assume this moves main status to DELIVERED or CLOSED if paid?
        // Or maybe just tracks delivery confirmation. 
        // Spec says "deliveryStatus = CONFIRMED" is needed for CLOSED.

        order.auditLogs.push({ action: 'DELIVERY_CONFIRMED', changedBy: 'CLIENT', detail: 'Client received goods' });
        await order.save();

        res.json(order);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.submitFeedback = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        order.feedback = { rating, comment };
        await order.save();
        res.json({ message: 'Feedback submitted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
