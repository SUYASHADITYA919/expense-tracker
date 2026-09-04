const express = require('express');
const router = express.Router();
const Split = require('../models/Split');

// Save a split breakdown for an expense
router.post('/', async (req, res) => {
  try {
    const { expenseId, splits } = req.body; 
    // splits: [{ personName: 'Alice', assignedAmount: 45.50, items: ['Pizza', 'Soda'] }]

    const splitRecord = await Split.create({
      expenseId,
      splits
    });

    res.status(201).json(splitRecord);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get split details for a specific expense
router.get('/:expenseId', async (req, res) => {
  try {
    const split = await Split.findOne({ expenseId: req.params.expenseId });
    if (!split) return res.status(404).json({ error: 'No split record found for this expense' });
    res.json(split);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;