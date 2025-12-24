const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    mobileNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    address: {
        type: String,
        required: true
    },
    otp: {
        type: String
    },
    otpExpires: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for order history
clientSchema.virtual('orderHistory', {
    ref: 'Order',
    localField: '_id',
    foreignField: 'clientId'
});

module.exports = mongoose.model('Client', clientSchema);
