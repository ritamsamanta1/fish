const mongoose = require('mongoose');

const farmerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String },
    farmingType: { type: String },
    area: { type: String },
    experience: { type: String },
    currentFish: { type: String },
    usedFeed: { type: String },
    usedMedicine: { type: String },
    remarks: { type: String }
}, { timestamps: true });

const Farmer = mongoose.model('Farmer', farmerSchema);

module.exports = Farmer;