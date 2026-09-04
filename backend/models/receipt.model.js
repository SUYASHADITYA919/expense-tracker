import mongoose from "mongoose";

const receiptSchema = new mongoose.Schema({
  imageUrl: {
    type: String,
    required: true
  },

  status: {
    type: String,
    enum: ["pending", "confirmed", "failed"],
    default: "pending"
  },

  merchant: String,

  date: Date,

  total: Number,

  lineItems: [
    {
      name: String,
      price: Number
    }
  ]
}, { timestamps: true });

export const Receipt = mongoose.model("Receipt", receiptSchema);