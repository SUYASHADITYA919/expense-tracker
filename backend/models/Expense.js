const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  category: { type: String, required: true, index: true },
  merchant: { type: String, required: true },
  date: { type: Date, required: true, default: Date.now },
  notes: { type: String, default: '' },
  receiptUrl: { type: String, default: null },
  lineItems: [
    {
      description: String,
      price: Number,
    }
  ],
  status: { type: String, enum: ['pending', 'confirmed'], default: 'confirmed' }
}, { timestamps: true });

module.exports = mongoose.model('Expense', ExpenseSchema);