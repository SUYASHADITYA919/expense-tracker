import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true
  },

  date: {
    type: Date,
    required: true
  },

  merchant: {
    type: String,
    required: true
  },

  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true
  },

  notes: {
    type: String
  },

  receiptId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Receipt"
  }
}, { timestamps: true });

export const Expense = mongoose.model("Expense", expenseSchema);