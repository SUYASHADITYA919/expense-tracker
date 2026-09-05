# Expense Tracker

A full-stack expense tracking app with AI-powered receipt scanning, budgeting, bill splitting, and spending analytics.

Built with **React (Vite)** on the frontend and **Node.js / Express / MongoDB** on the backend, with **OpenAI's vision API** for automatic receipt parsing and **Cloudinary** for receipt image storage.

---

## Features

### 💰 Expense Management
- Manual expense entry (amount, category, merchant, date, notes)
- Paginated, filterable, and sortable expense list — filter by category, date range, and amount
- Edit and delete existing expenses
- Export filtered expenses to CSV

### 🧾 AI Receipt Scanning
- Snap or upload a photo of a receipt
- OpenAI's `gpt-4o-mini` vision model extracts merchant, date, total, category, and individual line items
- Extracted data is validated server-side with **Zod** (with safe fallbacks) before it's ever shown to the user
- Review and confirm scanned data before it's saved as a real expense — nothing is added silently
- Receipt images are stored in Cloudinary

### 📊 Dashboard & Analytics
- Monthly category breakdown (spend by category)
- Budget vs. actual comparison per category
- 6-month spend trend
- Top merchants by total spend
- Anomaly detection — flags when a category's spend is significantly above its 3-month rolling average

### 🎯 Budgeting
- Set a monthly spending cap per category
- Live budget ring showing progress toward each cap

### 🤝 Split Expenses
- Divide any expense across multiple people by line item
- Manage a reusable list of contacts to split with

### 🎁 Extras
- Coupons & cashback offers to reduce spending
- Round-up savings — round purchases up and route the spare change to savings
- Challenges & streaks to gamify consistent saving

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS, Recharts, Lucide icons |
| Backend | Node.js, Express 5, Mongoose (MongoDB) |
| AI | OpenAI API (`gpt-4o-mini`, vision) |
| Image storage | Cloudinary + Multer |
| Validation | Zod |

---

## Project Structure

```
expense-tracker/
├── backend/
│   ├── config/
│   │   ├── db.js              # MongoDB connection
│   │   └── cloudinary.js      # Cloudinary + storage config
│   ├── middleware/
│   │   └── upload.js          # Multer upload handling
│   ├── models/
│   │   ├── Expense.js
│   │   ├── Receipt.js
│   │   ├── Budget.js
│   │   ├── Split.js
│   │   └── Category.js
│   ├── routes/
│   │   ├── expenseRoutes.js   # CRUD, filtering, pagination, CSV export
│   │   ├── aiRoutes.js        # AI receipt scanning
│   │   ├── dashboardRoutes.js # Analytics endpoints
│   │   ├── budgetRoutes.js    # Budget caps
│   │   └── splitRoutes.js     # Expense splitting
│   └── server.js
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── ExpenseApp.jsx      # Main app UI (all screens)
    │   └── main.jsx
    └── index.html
```

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- A MongoDB connection string (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- An [OpenAI API key](https://platform.openai.com/api-keys) (for receipt scanning)
- A [Cloudinary](https://cloudinary.com/) account (for receipt image storage)

### 1. Clone the repo

```bash
git clone https://github.com/yuvi-valecha/expense-tracker.git
cd expense-tracker
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create a `.env` file inside `backend/`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
OPENAI_API_KEY=your_openai_api_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

Run the backend:

```bash
npm run dev     # with nodemon (auto-restart)
# or
npm start
```

The API will run at `http://localhost:5000`.

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

The app will run at `http://localhost:5173` (default Vite port).

---

## API Reference

### Expenses — `/api/expenses`
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | List expenses (supports `page`, `limit`, `category`, `startDate`, `endDate`, `minAmount`, `maxAmount`, `sortBy`, `sortOrder`) |
| `GET` | `/:id` | Get a single expense |
| `POST` | `/` | Create an expense |
| `PUT` | `/:id` | Update an expense |
| `DELETE` | `/:id` | Delete an expense |
| `GET` | `/export/csv` | Export filtered expenses as CSV |

### AI — `/api/ai`
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/scan-receipt` | Upload a receipt image (`multipart/form-data`, field name `receipt`) and get back extracted merchant/date/total/category/line items |

### Dashboard — `/api/dashboard`
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/monthly-summary` | Category totals + budget vs. actual for a given month/year |
| `GET` | `/spend-trend` | Spend trend over the last N months (`months` query param, default 6) |
| `GET` | `/top-merchants` | Top merchants by total spend (`limit` query param, default 5) |
| `GET` | `/anomaly-check` | Compares current month's spend in a category to its 3-month rolling average |

### Budgets — `/api/budgets`
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | List all category budget caps |
| `POST` | `/` | Create or update a category's monthly cap |

### Splits — `/api/splits`
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/` | Save a split breakdown for an expense |
| `GET` | `/:expenseId` | Get the split record for a given expense |

---

## Notes

- The frontend currently ships with seed/mock data for several screens (contacts, coupons, round-up, challenges) for demo purposes; the backend routes above are the real, working API surface.
- Receipt scans are saved as `pending` records and only become permanent expenses once the user reviews and confirms them.

---

## License

ISC
