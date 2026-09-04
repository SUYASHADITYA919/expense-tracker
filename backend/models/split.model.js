import mongoose from "mongoose";

const splitSchema = new mongoose.Schema({
  expenseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Expense",
    required: true
  },

  contactId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Contact",
    required: true
  },

  amount: {
    type: Number,
    required: true
  }
});

export const Split = mongoose.model("Split", splitSchema);