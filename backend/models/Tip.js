const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    comment: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    adminReply: { // <-- NEW FIELD
        type: String,
        default: ''
    }
});

const tipSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String, // From Cloudinary
        default: ''
    },
    likes: {
        type: Number,
        default: 0
    },
    comments: [commentSchema] // An array of comments
}, {
    timestamps: true // This adds `createdAt` and `updatedAt` fields
});

const Tip = mongoose.model('Tip', tipSchema);

module.exports = Tip;