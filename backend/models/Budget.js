const mongoose = require('mongoose');

const BudgetSchema = new mongoose.Schema({
  category: { type: String, required: true, unique: true },
  monthlyCap: { type: Number, required: true },
});

module.exports = mongoose.model('Budget', BudgetSchema);