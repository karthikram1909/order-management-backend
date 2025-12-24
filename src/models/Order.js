const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    items: [{
        itemId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'CatalogItem',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        unitPrice: {
            type: Number,
            default: 0 // Set by admin later
        },
        totalPrice: {
            type: Number,
            default: 0
        }
    }],
    totalOrderValue: {
        type: Number,
        default: 0
    },
    orderStatus: {
        type: String,
        enum: [
            'NEW_INQUIRY',
            'PENDING_PRICING',
            'WAITING_CLIENT_APPROVAL',
            'ORDER_CONFIRMED',
            'AWAITING_PAYMENT',
            'PAYMENT_CLEARED',
            'IN_TRANSIT',
            'DELIVERED',
            'CLOSED',
            'CANCELLED'
        ],
        default: 'NEW_INQUIRY'
    },
    paymentType: {
        type: String,
        enum: ['CASH', 'CREDIT', 'NOT_SET'],
        default: 'NOT_SET'
    },
    paymentStatus: {
        type: String,
        enum: ['PENDING', 'PAID'],
        default: 'PENDING'
    },
    creditDueDate: {
        type: Date
    },
    deliveryStatus: {
        type: String,
        enum: ['PENDING', 'IN_TRANSIT', 'DELIVERED', 'CONFIRMED'],
        default: 'PENDING'
    },
    feedback: {
        rating: { type: Number, min: 1, max: 5 },
        comment: String
    },
    auditLogs: [{
        action: String,
        changedBy: String, // 'CLIENT' or 'ADMIN'
        detail: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Middleware to calculate item totals if unitPrice is present
orderSchema.pre('save', async function () {
    let orderTotal = 0;
    if (this.items && this.items.length > 0) {
        this.items.forEach(item => {
            if (item.unitPrice && item.quantity) {
                item.totalPrice = item.unitPrice * item.quantity;
                orderTotal += item.totalPrice;
            }
        });
        this.totalOrderValue = orderTotal;
    }
});

module.exports = mongoose.model('Order', orderSchema);
