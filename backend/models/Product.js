const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    imageUrl: { type: String, required: true },
    details: { type: String, required: true },
    originalPrice: { type: Number, required: true },
    discountPercent: { type: Number, required: true },
    category: { 
        type: String, 
        required: true,
        enum: ['Fish Seed', 'Fish Medicine'] // Enforces categories
    }
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;