const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');

// Get all budget caps
router.get('/', async (req, res) => {
  try {
    const budgets = await Budget.find();
    res.json(budgets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Set or update a monthly cap for a category
router.post('/', async (req, res) => {
  try {
    const { category, monthlyCap } = req.body;
    
    const budget = await Budget.findOneAndUpdate(
      { category },
      { monthlyCap },
      { upsert: true, new: true, runValidators: true }
    );
    
    res.status(200).json(budget);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;