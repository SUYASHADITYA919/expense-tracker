const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const Receipt = require('../models/Receipt');

// 1. Create Expense (Manual entry or confirming scanned receipt)
router.post('/', async (req, res) => {
  try {
    const { amount, category, merchant, date, notes, receiptUrl, lineItems, receiptId } = req.body;

    const expense = await Expense.create({
      amount,
      category,
      merchant,
      date: date || new Date(),
      notes,
      receiptUrl,
      lineItems,
      status: 'confirmed'
    });

    // Record correction log if coming from AI scan confirmation
    if (receiptId) {
      await Receipt.findByIdAndUpdate(receiptId, {
        savedData: { amount, category, merchant, date, notes, lineItems },
        isConfirmed: true
      });
    }

    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. CSV Export Route
router.get('/export/csv', async (req, res) => {
  try {
    const { category, startDate, endDate } = req.query;
    const filter = { status: 'confirmed' };

    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }

    const expenses = await Expense.find(filter).sort({ date: -1 });

    // Build CSV Headers & Rows
    let csvContent = 'ID,Date,Merchant,Category,Amount,Notes\n';
    expenses.forEach(e => {
      const formattedDate = new Date(e.date).toISOString().split('T')[0];
      const sanitizedNotes = e.notes ? `"${e.notes.replace(/"/g, '""')}"` : '';
      const sanitizedMerchant = `"${e.merchant.replace(/"/g, '""')}"`;
      csvContent += `${e._id},${formattedDate},${sanitizedMerchant},${e.category},${e.amount},${sanitizedNotes}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="expenses.csv"');
    res.status(200).send(csvContent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Paginated & Filtered Expense List
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      startDate, 
      endDate, 
      minAmount, 
      maxAmount, 
      sortBy = 'date', 
      sortOrder = 'desc' 
    } = req.query;

    const filter = { status: 'confirmed' };
    if (category) filter.category = category;
    
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }
    
    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) filter.amount.$gte = Number(minAmount);
      if (maxAmount) filter.amount.$lte = Number(maxAmount);
    }

    const expenses = await Expense.find(filter)
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await Expense.countDocuments(filter);

    res.json({
      expenses,
      totalCount: total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Get Single Expense Details
router.get('/:id', async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    res.json(expense);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Update Expense
router.put('/:id', async (req, res) => {
  try {
    const updatedExpense = await Expense.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedExpense) return res.status(404).json({ error: 'Expense not found' });
    res.json(updatedExpense);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Delete Expense
router.delete('/:id', async (req, res) => {
  try {
    const deletedExpense = await Expense.findByIdAndDelete(req.params.id);
    if (!deletedExpense) return res.status(404).json({ error: 'Expense not found' });
    res.json({ message: 'Expense deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;