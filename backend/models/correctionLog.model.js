import mongoose from "mongoose";

const correctionSchema = new mongoose.Schema({
  receiptId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Receipt",
    required: true
  },

  aiOutput: {
    merchant: String,
    date: Date,
    total: Number
  },

  finalSaved: {
    merchant: String,
    date: Date,
    total: Number
  }

}, { timestamps: true });

export const CorrectionLog = mongoose.model("CorrectionLog", correctionSchema);