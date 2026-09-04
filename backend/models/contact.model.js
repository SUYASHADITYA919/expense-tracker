import mongoose from "mongoose";

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  phone: {
    type: String
  }
});

export const Contact = mongoose.model("Contact", contactSchema);