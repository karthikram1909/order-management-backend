const mongoose = require('mongoose');

const catalogItemSchema = new mongoose.Schema({
    itemName: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String
    },
    unit: {
        type: String,
        required: true,
        enum: ['kg', 'box', 'piece', 'liter', 'ton', 'bag'] // extensible
    },
    isActive: {
        type: Boolean,
        default: true
    }
});

module.exports = mongoose.model('CatalogItem', catalogItemSchema);
