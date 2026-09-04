import mongoose from "mongoose";

const budgetSchema = new mongoose.Schema({
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true
  },

  month: {
    type: String,
    required: true
  },

  limit: {
    type: Number,
    required: true
  }
});

export const Budget = mongoose.model("Budget", budgetSchema);