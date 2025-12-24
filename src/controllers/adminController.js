const Admin = require('../models/Admin');
const Order = require('../models/Order');
const jwt = require('jsonwebtoken');
const orderService = require('../services/orderService');

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const admin = await Admin.findOne({ email });
        if (!admin) return res.status(400).json({ message: 'Admin not found' });

        const isMatch = await admin.comparePassword(password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ _id: admin._id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: '15m' });
        const refreshToken = jwt.sign({ _id: admin._id, role: admin.role }, process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({ token, refreshToken, admin: { id: admin._id, name: admin.username, email: admin.email } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.refreshToken = async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ message: 'Refresh Token Required' });

    try {
        const verified = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET);
        const admin = await Admin.findById(verified._id);
        if (!admin) return res.status(403).json({ message: 'Admin not found' });

        const newToken = jwt.sign({ _id: admin._id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: '15m' });
        res.json({ token: newToken });
    } catch (err) {
        console.log("Refresh Token Error:", err.message);
        res.status(403).json({ message: 'Invalid Refresh Token' });
    }
};

exports.getInquiries = async (req, res) => {
    try {
        const inquiries = await Order.find({ orderStatus: 'NEW_INQUIRY' }).populate('clientId').populate('items.itemId');
        res.json(inquiries);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.setPricing = async (req, res) => {
    try {
        const { items } = req.body; // items: [{itemId, unitPrice}]
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        // Update prices
        items.forEach(priceUpdate => {
            const item = order.items.find(i => i.itemId.toString() === priceUpdate.itemId);
            if (item) {
                item.unitPrice = priceUpdate.unitPrice;
            }
        });

        // Update Status directly on this instance to avoid version conflict
        const oldStatus = order.orderStatus;
        const newStatus = 'WAITING_CLIENT_APPROVAL';

        if (oldStatus !== newStatus) {
            // Validate transition manually or valid transition map
            // Simple check
            if (['NEW_INQUIRY', 'PENDING_PRICING', 'WAITING_CLIENT_APPROVAL'].includes(oldStatus)) {
                order.orderStatus = newStatus;
                order.auditLogs.push({
                    action: 'STATUS_CHANGE',
                    changedBy: 'ADMIN',
                    detail: `Status changed from ${oldStatus} to ${newStatus}. Prices updated.`,
                    timestamp: new Date()
                });
            }
        }

        await order.save(); // Triggers calc total middleware

        res.json(order);
    } catch (err) {
        console.error("setPricing Error:", err);
        res.status(500).json({ error: err.message });
    }
};

exports.updatePaymentStatus = async (req, res) => {
    try {
        const { status } = req.body; // PAID
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        order.paymentStatus = status;
        if (status === 'PAID') {
            await orderService.updateOrderStatus(order._id, 'PAYMENT_CLEARED', 'ADMIN', 'Payment marked as PAID');
        }
        await order.save();
        res.json(order);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.dispatchOrder = async (req, res) => {
    try {
        await orderService.updateOrderStatus(req.params.id, 'IN_TRANSIT', 'ADMIN', 'Order dispatched');
        res.json({ message: 'Order dispatched' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getOrders = async (req, res) => {
    try {
        const { status } = req.query;
        const filter = status ? { orderStatus: status } : {};
        const orders = await Order.find(filter).populate('clientId');
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.cancelOrder = async (req, res) => {
    try {
        await orderService.updateOrderStatus(req.params.id, 'CANCELLED', 'ADMIN', 'Order cancelled by Admin');
        res.json({ message: 'Order cancelled' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.extendDueDate = async (req, res) => {
    try {
        const { date } = req.body;
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        order.creditDueDate = date;

        order.auditLogs.push({
            action: 'UPDATED',
            changedBy: 'ADMIN',
            detail: `Credit due date extended to ${date}`
        });

        await order.save();
        res.json(order);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deliverOrder = async (req, res) => {
    try {
        await orderService.updateOrderStatus(req.params.id, 'DELIVERED', 'ADMIN', 'Order marked as delivered by Admin');
        res.json({ message: 'Order delivered' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
