const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const OpenAI = require('openai');
const { z } = require('zod');
const Receipt = require('../models/Receipt');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Robust Schema with item-level fallbacks
const receiptSchema = z.object({
  merchant: z.string().catch('Unknown Merchant'),
  date: z.string().catch(() => new Date().toISOString().split('T')[0]),
  total: z.number().catch(0),
  category: z.string().catch('Uncategorized'),
  lineItems: z.array(
    z.object({
      description: z.string().catch('Item'),
      price: z.number().catch(0)
    })
  ).catch([])
});

router.post('/scan-receipt', upload.single('receipt'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const imageUrl = req.file.path;

    // Vision API Call
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract receipt details: merchant, date (YYYY-MM-DD), total (number), category, and line items (description, price). Respond strictly in JSON format.'
            },
            {
              type: 'image_url',
              image_url: { url: imageUrl }
            }
          ]
        }
      ],
      response_format: { type: 'json_object' }
    });

    const rawJson = JSON.parse(response.choices[0].message.content);
    
    // Server-side Zod validation
    const parsedData = receiptSchema.parse(rawJson);

    // Save as pending receipt log
    const receiptLog = await Receipt.create({
      imageUrl,
      extractedData: parsedData,
      isConfirmed: false
    });

    res.status(200).json({
      receiptId: receiptLog._id,
      imageUrl,
      data: parsedData
    });
  } catch (err) {
    console.error('AI Scan Error:', err);
    res.status(422).json({ 
      error: 'Failed to parse receipt. Drop into manual entry.',
      fallbackImageUrl: req.file ? req.file.path : null 
    });
  }
});

module.exports = router;