const mongoose = require('mongoose');

const ReceiptSchema = new mongoose.Schema({
  imageUrl: { type: String, required: true },
  extractedData: { type: Object, required: true },
  savedData: { type: Object, default: null },
  isConfirmed: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Receipt', ReceiptSchema);