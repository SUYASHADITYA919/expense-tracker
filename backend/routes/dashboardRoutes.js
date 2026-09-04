const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');

// 1. Monthly Summary: Category Pie Chart & Budget vs Actual
router.get('/monthly-summary', async (req, res) => {
  try {
    const now = new Date();
    const year = req.query.year ? parseInt(req.query.year) : now.getFullYear();
    const month = req.query.month ? parseInt(req.query.month) - 1 : now.getMonth();

    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

    // Aggregate category totals
    const categoryTotals = await Expense.aggregate([
      { 
        $match: { 
          status: 'confirmed',
          date: { $gte: startOfMonth, $lte: endOfMonth } 
        } 
      },
      { 
        $group: { 
          _id: '$category', 
          totalSpent: { $sum: '$amount' } 
        } 
      }
    ]);

    // Compute Budget vs Actual for every configured category
    const budgets = await Budget.find();
    
    const budgetVsActual = budgets.map(b => {
      const found = categoryTotals.find(c => c._id === b.category);
      return {
        category: b.category,
        budget: b.monthlyCap,
        actual: found ? found.totalSpent : 0
      };
    });

    res.json({ categoryTotals, budgetVsActual });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Spend Trend Line (Last N Months)
router.get('/spend-trend', async (req, res) => {
  try {
    const monthsLimit = parseInt(req.query.months) || 6;
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - (monthsLimit - 1), 1);

    const trend = await Expense.aggregate([
      {
        $match: {
          status: 'confirmed',
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          totalSpent: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json(trend);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Top Merchants Dashboard Card
router.get('/top-merchants', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    const topMerchants = await Expense.aggregate([
      { $match: { status: 'confirmed' } },
      {
        $group: {
          _id: '$merchant',
          totalSpent: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: limit }
    ]);

    res.json(topMerchants);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Anomaly Check: Target Category vs 3-Month Rolling Average
router.get('/anomaly-check', async (req, res) => {
  try {
    const targetCategory = req.query.category || 'Groceries';
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfThreeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

    const stats = await Expense.aggregate([
      {
        $match: {
          category: targetCategory,
          status: 'confirmed',
          date: { $gte: startOfThreeMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            isCurrentMonth: { $gte: ['$date', startOfCurrentMonth] }
          },
          total: { $sum: '$amount' }
        }
      }
    ]);

    const currentSpent = stats.find(s => s._id.isCurrentMonth)?.total || 0;
    const pastThreeMonthsTotal = stats.find(s => !s._id.isCurrentMonth)?.total || 0;
    const rollingAvg = pastThreeMonthsTotal / 3;

    let anomalyPercent = 0;
    if (rollingAvg > 0) {
      anomalyPercent = Math.round(((currentSpent - rollingAvg) / rollingAvg) * 100);
    }

    res.json({
      category: targetCategory,
      currentSpent,
      rollingAvg: Math.round(rollingAvg * 100) / 100,
      anomalyPercent,
      anomalyMessage: anomalyPercent > 0 
        ? `${targetCategory} up ${anomalyPercent}% vs your 3-month average` 
        : null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;