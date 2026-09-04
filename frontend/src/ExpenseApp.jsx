import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, BarChart, Bar, CartesianGrid,
} from "recharts";
import {
  Home, PlusCircle, ListOrdered, PiggyBank, MoreHorizontal, Receipt,
  Users, Split, ArrowLeft, Search, SlidersHorizontal, X, Check, Pencil,
  Trash2, Camera, TrendingUp, AlertTriangle, ChevronRight, ChevronLeft,
  Utensils, ShoppingCart, Car, ShoppingBag, Film, Zap, HeartPulse, Plane,
  Building2, Tag, Calendar, DollarSign, ArrowUpDown, Store, UserPlus,
  Sparkles, ArrowRight, Copy, Percent, Gift, Flame, Trophy, Target,
  Coins, Lightbulb, PartyPopper,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Design tokens & constants                                          */
/* ------------------------------------------------------------------ */

const CATEGORIES = [
  { id: "food", label: "Food & Dining", icon: Utensils, color: "#BE4B32" },
  { id: "groceries", label: "Groceries", icon: ShoppingCart, color: "#7C9A82" },
  { id: "transport", label: "Transport", icon: Car, color: "#3D6B8A" },
  { id: "shopping", label: "Shopping", icon: ShoppingBag, color: "#B98A3E" },
  { id: "entertainment", label: "Entertainment", icon: Film, color: "#8A5C9E" },
  { id: "bills", label: "Bills & Utilities", icon: Zap, color: "#C79226" },
  { id: "health", label: "Health", icon: HeartPulse, color: "#A44A5C" },
  { id: "travel", label: "Travel", icon: Plane, color: "#356B5D" },
  { id: "housing", label: "Housing", icon: Building2, color: "#5B4636" },
  { id: "other", label: "Other", icon: Tag, color: "#8A8578" },
];

const catById = (id) => CATEGORIES.find((c) => c.id === id) || CATEGORIES[9];

const MERCHANTS = {
  food: ["Corner Bistro", "Ember Kitchen", "Noodle House", "The Daily Grind"],
  groceries: ["Green Basket", "FreshMart", "Corner Grocer"],
  transport: ["City Cabs", "MetroCard", "QuickPark Garage"],
  shopping: ["Thread & Co", "Uptown Outfitters", "HomeGoods Plus"],
  entertainment: ["Lumière Cinema", "Riverside Arcade", "StageDoor Theatre"],
  bills: ["CityPower Co", "AquaFlow Utilities", "NetLine Broadband"],
  health: ["Wellness Pharmacy", "CityCare Clinic"],
  travel: ["SkyLine Air", "Harbor Hotel"],
  housing: ["Maple Court Mgmt", "HomeSecure Insurance"],
  other: ["General Store", "Misc Vendor"],
};

const fmtMoney = (n) =>
  `$${Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (d) => {
  const dt = new Date(d);
  return dt.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

const fmtDateShort = (d) => {
  const dt = new Date(d);
  return dt.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const monthKey = (d) => {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
};

const monthLabel = (key) => {
  const [y, m] = key.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString(undefined, { month: "short" });
};

function roundUpTo(amount, nearest) {
  const rounded = Math.ceil(amount / nearest) * nearest;
  return { rounded, spare: Math.round((rounded - amount) * 100) / 100 };
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

/* ------------------------------------------------------------------ */
/*  Mock seed data                                                     */
/* ------------------------------------------------------------------ */

function seedExpenses() {
  const out = [];
  const today = new Date();
  let anomalySet = false;
  for (let m = 3; m >= 0; m--) {
    const monthDate = new Date(today.getFullYear(), today.getMonth() - m, 1);
    const count = 8 + Math.floor(Math.random() * 5);
    for (let i = 0; i < count; i++) {
      const cat = CATEGORIES[Math.floor(Math.random() * (CATEGORIES.length - 1))];
      const day = 1 + Math.floor(Math.random() * 27);
      const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
      if (date > today) continue;
      const baseAmt = {
        food: 35, groceries: 70, transport: 22, shopping: 60, entertainment: 40,
        bills: 90, health: 55, travel: 180, housing: 950, other: 25,
      }[cat.id] || 30;
      let amount = Math.round((baseAmt * (0.5 + Math.random() * 1.3)) * 100) / 100;
      let isAnomaly = false;
      if (m === 0 && !anomalySet && cat.id !== "housing" && Math.random() > 0.7) {
        amount = amount * 5.5;
        isAnomaly = true;
        anomalySet = true;
      }
      const merchants = MERCHANTS[cat.id];
      out.push({
        id: uid(),
        amount,
        category: cat.id,
        date: date.toISOString().slice(0, 10),
        notes: "",
        merchant: merchants[Math.floor(Math.random() * merchants.length)],
        isAnomaly,
      });
    }
  }
  if (!anomalySet && out.length) {
    out[out.length - 1].isAnomaly = true;
  }
  return out.sort((a, b) => new Date(b.date) - new Date(a.date));
}

const seedBudgets = () => ({
  food: 400, groceries: 350, transport: 150, shopping: 250, entertainment: 120,
  bills: 300, health: 150, travel: 200, housing: 1000, other: 100,
});

const seedCoupons = () => [
  { id: uid(), brand: "FreshMart", color: "#7C9A82", category: "groceries", code: "FRESH20", discount: "20% off groceries", detail: "Min. spend $40 · valid on all orders", expiresInDays: 6 },
  { id: uid(), brand: "Corner Bistro", color: "#BE4B32", category: "food", code: "BISTRO10", discount: "10% off + free dessert", detail: "Dine-in only", expiresInDays: 12 },
  { id: uid(), brand: "City Cabs", color: "#3D6B8A", category: "transport", code: "RIDE5", discount: "$5 cashback on rides", detail: "Up to 3 rides per week", expiresInDays: 3 },
  { id: uid(), brand: "Thread & Co", color: "#B98A3E", category: "shopping", code: "THREAD15", discount: "15% off new arrivals", detail: "Excludes sale items", expiresInDays: 20 },
  { id: uid(), brand: "Lumière Cinema", color: "#8A5C9E", category: "entertainment", code: "MOVIE2FOR1", discount: "2-for-1 tickets", detail: "Tuesdays & Wednesdays only", expiresInDays: 9 },
  { id: uid(), brand: "CityPower Co", color: "#C79226", category: "bills", code: "POWERSAVE", discount: "$8 bill credit", detail: "Auto-pay enrollment required", expiresInDays: 15 },
  { id: uid(), brand: "Wellness Pharmacy", color: "#A44A5C", category: "health", code: "WELL10", discount: "10% off wellness items", detail: "Vitamins & supplements", expiresInDays: 30 },
  { id: uid(), brand: "SkyLine Air", color: "#356B5D", category: "travel", code: "FLYAWAY", discount: "$30 off flights $200+", detail: "Domestic routes only", expiresInDays: 25 },
];

const seedChallenges = () => [
  { id: uid(), title: "No-Spend Weekend", desc: "Skip discretionary spending for 2 days straight.", goal: 60, saved: 24, streak: 2, active: true, icon: "flame" },
  { id: uid(), title: "Coffee Run Cutback", desc: "Skip 3 café visits this week and save the difference.", goal: 30, saved: 10, streak: 1, active: false, icon: "target" },
  { id: uid(), title: "Save $100 this month", desc: "Set aside a little from every paycheck.", goal: 100, saved: 45, streak: 6, active: false, icon: "trophy" },
];

const seedContacts = () => [
  { id: uid(), name: "Priya Nair", color: "#BE4B32" },
  { id: uid(), name: "Alex Chen", color: "#3D6B8A" },
  { id: uid(), name: "Jordan Lee", color: "#7C9A82" },
  { id: uid(), name: "Sam Osei", color: "#B98A3E" },
];

/* ------------------------------------------------------------------ */
/*  Global styles                                                      */
/* ------------------------------------------------------------------ */

const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap');

    .ledger-app, .ledger-app * { box-sizing: border-box; }
    .ledger-app {
      --ink: #1B3A2B;
      --ink-dark: #12261C;
      --paper: #F3EEE1;
      --card: #FCFAF3;
      --amber: #D99A34;
      --amber-dark: #B87F22;
      --rust: #BE4B32;
      --sage: #6E8F74;
      --text: #22281F;
      --text-muted: #6E6A5C;
      --line: #DAD2BC;
      --line-strong: #C6BC9E;
      font-family: 'Inter', sans-serif;
      color: var(--text);
      background: #E4DECB;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .ledger-shell {
      width: 100%;
      max-width: 430px;
      min-height: 100vh;
      background: var(--paper);
      position: relative;
      display: flex;
      flex-direction: column;
      box-shadow: 0 0 60px rgba(0,0,0,0.12);
      overflow-x: hidden;
    }
    .num { font-family: 'Fraunces', serif; font-variant-numeric: tabular-nums; }

    .topbar {
      position: sticky; top: 0; z-index: 20;
      background: var(--paper);
      padding: 18px 20px 14px;
      border-bottom: 1px solid var(--line);
    }
    .topbar-row { display: flex; align-items: center; gap: 12px; }
    .back-btn {
      width: 34px; height: 34px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      background: var(--card); border: 1px solid var(--line); color: var(--ink);
      cursor: pointer; flex-shrink: 0;
    }
    .back-btn:active { transform: scale(0.94); }
    .topbar-title { font-family: 'Fraunces', serif; font-weight: 600; font-size: 20px; letter-spacing: -0.01em; }
    .topbar-sub { font-size: 12.5px; color: var(--text-muted); margin-top: 2px; }

    .screen { flex: 1; padding: 18px 20px 100px; overflow-y: auto; }

    .card {
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 16px;
    }

    .btn {
      font-family: 'Inter', sans-serif;
      font-weight: 600; font-size: 14.5px;
      border-radius: 8px; border: none; cursor: pointer;
      padding: 13px 18px; display: inline-flex; align-items: center;
      justify-content: center; gap: 8px; transition: transform .1s ease, opacity .15s ease;
    }
    .btn:active { transform: scale(0.97); }
    .btn-primary { background: var(--ink); color: #F3EEE1; width: 100%; }
    .btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }
    .btn-ghost { background: transparent; color: var(--ink); border: 1px solid var(--line-strong); }
    .btn-amber { background: var(--amber); color: #2A1D08; }
    .btn-danger-ghost { background: transparent; color: var(--rust); border: 1px solid rgba(190,75,50,0.35); }
    .btn-sm { padding: 8px 12px; font-size: 13px; border-radius: 7px; }

    .field-label {
      font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em;
      color: var(--text-muted); margin-bottom: 7px; display: block;
    }
    .input {
      width: 100%; border: 1px solid var(--line-strong); background: var(--card);
      border-radius: 8px; padding: 12px 13px; font-size: 15px; font-family: 'Inter', sans-serif;
      color: var(--text); outline: none;
    }
    .input:focus { border-color: var(--ink); box-shadow: 0 0 0 3px rgba(27,58,43,0.1); }
    textarea.input { resize: vertical; min-height: 70px; font-family: 'Inter', sans-serif; }

    .amount-input-wrap { display: flex; align-items: baseline; justify-content: center; gap: 4px; padding: 22px 0 14px; }
    .amount-input-wrap .sign { font-family: 'Fraunces', serif; font-size: 30px; color: var(--text-muted); }
    .amount-input {
      font-family: 'Fraunces', serif; font-weight: 600; font-size: 52px; border: none; background: transparent;
      outline: none; color: var(--ink); text-align: center; width: 100%; max-width: 260px;
    }
    .amount-input::placeholder { color: #C9C2AC; }

    .cat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .cat-chip {
      display: flex; flex-direction: column; align-items: center; gap: 7px;
      padding: 13px 6px; border-radius: 10px; border: 1.5px solid var(--line);
      background: var(--card); cursor: pointer; font-size: 12px; font-weight: 600; color: var(--text);
      text-align: center; line-height: 1.2;
    }
    .cat-chip.active { border-color: var(--ink); background: rgba(27,58,43,0.06); }
    .cat-chip-icon {
      width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff;
    }

    .tabbar {
      position: sticky; bottom: 0; z-index: 30;
      background: var(--card); border-top: 1px solid var(--line);
      display: flex; padding: 8px 6px calc(8px + env(safe-area-inset-bottom));
    }
    .tab-btn {
      flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px;
      background: none; border: none; cursor: pointer; color: var(--text-muted);
      padding: 6px 2px; font-size: 10.5px; font-weight: 600; font-family: 'Inter', sans-serif;
    }
    .tab-btn.active { color: var(--ink); }
    .tab-btn .dot { width: 5px; height: 5px; border-radius: 50%; background: var(--amber); margin-top: -1px; }
    .fab {
      width: 46px; height: 46px; border-radius: 50%; background: var(--ink); color: var(--paper);
      display: flex; align-items: center; justify-content: center; margin-top: -22px;
      border: 4px solid var(--paper); cursor: pointer;
    }

    .dashed-row { border-bottom: 1px dashed var(--line-strong); }
    .dashed-row:last-child { border-bottom: none; }

    .stat-hero {
      background: var(--ink); color: var(--paper); border-radius: 12px; padding: 22px 20px;
      position: relative; overflow: hidden;
    }
    .stat-hero::after {
      content: ''; position: absolute; right: -30px; top: -40px; width: 140px; height: 140px;
      border-radius: 50%; background: rgba(217,154,52,0.18);
    }
    .stat-hero-label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.75; font-weight: 600; }
    .stat-hero-amount { font-family: 'Fraunces', serif; font-size: 40px; font-weight: 600; margin-top: 6px; }

    .section-title { font-family: 'Fraunces', serif; font-size: 17px; font-weight: 600; margin: 0 0 10px; letter-spacing: -0.01em; }
    .section-block { margin-top: 22px; }

    .stamp {
      display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 700;
      color: var(--rust); border: 1.5px solid var(--rust); border-radius: 6px; padding: 3px 8px;
      transform: rotate(-2deg); text-transform: uppercase; letter-spacing: 0.03em;
    }

    .expense-row { display: flex; align-items: center; gap: 12px; padding: 12px 0; cursor: pointer; }
    .expense-icon { width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; flex-shrink: 0; }
    .expense-mid { flex: 1; min-width: 0; }
    .expense-merchant { font-weight: 600; font-size: 14.5px; display: flex; align-items: center; gap: 6px; }
    .expense-meta { font-size: 12.5px; color: var(--text-muted); margin-top: 2px; }
    .expense-amt { font-family: 'Fraunces', serif; font-weight: 600; font-size: 16px; flex-shrink: 0; }

    .chip-toggle {
      padding: 8px 13px; border-radius: 20px; border: 1.5px solid var(--line-strong); background: var(--card);
      font-size: 13px; font-weight: 600; cursor: pointer; color: var(--text); display: inline-flex; align-items: center; gap: 6px;
    }
    .chip-toggle.active { background: var(--ink); border-color: var(--ink); color: var(--paper); }

    .modal-overlay {
      position: fixed; inset: 0; background: rgba(18,38,28,0.45); z-index: 100;
      display: flex; align-items: flex-end; justify-content: center;
    }
    .modal-sheet {
      width: 100%; max-width: 430px; background: var(--paper); border-radius: 18px 18px 0 0;
      max-height: 88vh; overflow-y: auto; padding: 20px 20px calc(24px + env(safe-area-inset-bottom));
      animation: sheetUp .22s ease;
    }
    @keyframes sheetUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .modal-handle { width: 38px; height: 4px; border-radius: 3px; background: var(--line-strong); margin: 0 auto 14px; }
    .modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
    .modal-title { font-family: 'Fraunces', serif; font-size: 19px; font-weight: 600; }
    .icon-btn { background: none; border: none; cursor: pointer; color: var(--text-muted); padding: 4px; }

    .toast {
      position: fixed; bottom: 90px; left: 50%; transform: translateX(-50%);
      background: var(--ink); color: var(--paper); padding: 12px 20px; border-radius: 30px;
      font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 8px; z-index: 200;
      box-shadow: 0 10px 30px rgba(0,0,0,0.25); animation: toastIn .25s ease;
      max-width: 90%;
    }
    @keyframes toastIn { from { opacity: 0; transform: translate(-50%, 10px); } to { opacity: 1; transform: translate(-50%, 0); } }

    .empty-state { text-align: center; padding: 50px 20px; color: var(--text-muted); }
    .empty-state svg { margin-bottom: 12px; opacity: 0.5; }

    .receipt-card {
      background: var(--card); border: 1px solid var(--line); border-radius: 4px; padding: 20px;
      position: relative;
    }
    .receipt-card::before, .receipt-card::after {
      content: ''; position: absolute; left: 0; right: 0; height: 10px;
      background-image: radial-gradient(circle at 8px 5px, transparent 5px, var(--paper) 5.5px);
      background-size: 16px 10px; background-repeat: repeat-x;
    }
    .receipt-card::before { top: -1px; }
    .receipt-card::after { bottom: -1px; transform: rotate(180deg); }

    .avatar {
      width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
      color: #fff; font-weight: 700; font-size: 13px; flex-shrink: 0;
    }

    .segmented { display: flex; background: var(--line); border-radius: 8px; padding: 3px; gap: 3px; }
    .segmented button {
      flex: 1; border: none; background: transparent; padding: 9px 8px; border-radius: 6px; font-weight: 600;
      font-size: 13px; cursor: pointer; color: var(--text-muted);
    }
    .segmented button.active { background: var(--card); color: var(--ink); }

    .pagination { display: flex; align-items: center; justify-content: center; gap: 14px; margin-top: 18px; }
    .page-btn {
      width: 34px; height: 34px; border-radius: 50%; border: 1px solid var(--line-strong); background: var(--card);
      display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--ink);
    }
    .page-btn:disabled { opacity: 0.35; cursor: not-allowed; }
    .page-info { font-size: 13px; color: var(--text-muted); font-weight: 600; }

    .anomaly-list-item { display: flex; gap: 10px; align-items: flex-start; padding: 11px 0; }
    .more-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 6px; }
    .more-card {
      background: var(--card); border: 1px solid var(--line); border-radius: 10px; padding: 16px;
      display: flex; flex-direction: column; gap: 10px; cursor: pointer;
    }
    .more-card:active { transform: scale(0.98); }
    .more-icon { width: 36px; height: 36px; border-radius: 8px; background: var(--ink); color: var(--paper); display: flex; align-items: center; justify-content: center; }

    .success-burst { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 50px 20px; text-align: center; }
    .success-circle {
      width: 74px; height: 74px; border-radius: 50%; background: var(--sage); color: #fff;
      display: flex; align-items: center; justify-content: center; margin-bottom: 18px;
      animation: pop .35s cubic-bezier(.34,1.56,.64,1);
    }
    @keyframes pop { from { transform: scale(0.4); opacity: 0; } to { transform: scale(1); opacity: 1; } }

    input[type="date"].input { font-family: 'Inter', sans-serif; }
    ::-webkit-scrollbar { width: 0; height: 0; }

    /* Coupons */
    .coupon-card {
      display: flex; align-items: stretch; background: var(--card); border: 1px solid var(--line);
      border-radius: 10px; overflow: hidden; margin-bottom: 12px;
    }
    .coupon-brand {
      width: 56px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
      color: #fff; font-weight: 700; font-size: 15px; position: relative;
    }
    .coupon-brand::after {
      content: ''; position: absolute; right: -1px; top: 0; bottom: 0; width: 0;
      border-right: 2px dashed rgba(255,255,255,0.55);
    }
    .coupon-body { flex: 1; padding: 12px 14px; min-width: 0; }
    .coupon-discount { font-weight: 700; font-size: 14.5px; }
    .coupon-detail { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
    .coupon-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 10px; }
    .coupon-code {
      font-family: 'Fraunces', serif; font-weight: 600; font-size: 13.5px; letter-spacing: 0.04em;
      border: 1.5px dashed var(--line-strong); border-radius: 6px; padding: 4px 9px; background: var(--paper);
    }
    .coupon-expiry { font-size: 11px; color: var(--rust); font-weight: 600; }
    .copy-btn {
      display: flex; align-items: center; gap: 5px; background: var(--ink); color: var(--paper);
      border: none; border-radius: 6px; padding: 6px 10px; font-size: 12px; font-weight: 700; cursor: pointer;
    }
    .copy-btn.copied { background: var(--sage); }

    /* Round-up */
    .tip-banner {
      display: flex; gap: 10px; align-items: flex-start; background: rgba(217,154,52,0.14);
      border: 1px solid rgba(217,154,52,0.4); border-radius: 10px; padding: 12px 13px; margin-top: 14px;
    }
    .tip-banner b { color: var(--amber-dark); }
    .roundup-row { display: flex; align-items: center; gap: 12px; padding: 11px 0; }
    .roundup-old { color: var(--text-muted); text-decoration: line-through; font-size: 12.5px; }
    .roundup-new { font-weight: 700; }
    .roundup-spare { color: var(--sage); font-weight: 700; font-size: 13px; margin-left: auto; }

    /* Challenges */
    .streak-badge {
      display: inline-flex; align-items: center; gap: 5px; background: var(--ink); color: var(--paper);
      border-radius: 20px; padding: 5px 12px; font-weight: 700; font-size: 13px;
    }
    .progress-track { height: 9px; background: var(--line); border-radius: 6px; overflow: hidden; margin-top: 10px; }
    .progress-fill { height: 100%; background: var(--sage); border-radius: 6px; transition: width .3s ease; }
    .challenge-card { background: var(--card); border: 1px solid var(--line); border-radius: 10px; padding: 16px; margin-bottom: 14px; }
    .challenge-icon { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; flex-shrink: 0; }
  `}</style>
);

/* ------------------------------------------------------------------ */
/*  Small shared components                                            */
/* ------------------------------------------------------------------ */

function TopBar({ title, subtitle, onBack }) {
  return (
    <div className="topbar">
      <div className="topbar-row">
        {onBack && (
          <button className="back-btn" onClick={onBack} aria-label="Back">
            <ArrowLeft size={17} />
          </button>
        )}
        <div>
          <div className="topbar-title">{title}</div>
          {subtitle && <div className="topbar-sub">{subtitle}</div>}
        </div>
      </div>
    </div>
  );
}

function CategoryIcon({ id, size = 18 }) {
  const cat = catById(id);
  const Icon = cat.icon;
  return (
    <div className="expense-icon" style={{ background: cat.color }}>
      <Icon size={size} />
    </div>
  );
}

function Toast({ message, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="toast">
      <Check size={16} /> {message}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Screen: Manual Expense Entry                                       */
/* ------------------------------------------------------------------ */

function ExpenseEntryScreen({ onSave, editing, onCancelEdit }) {
  const [amount, setAmount] = useState(editing ? String(editing.amount) : "");
  const [category, setCategory] = useState(editing ? editing.category : "food");
  const [date, setDate] = useState(editing ? editing.date : new Date().toISOString().slice(0, 10));
  const [merchant, setMerchant] = useState(editing ? editing.merchant : "");
  const [notes, setNotes] = useState(editing ? editing.notes : "");
  const [showSuccess, setShowSuccess] = useState(false);

  const valid = parseFloat(amount) > 0 && category && date;

  const parsedAmount = parseFloat(amount);
  const roundSuggestion = parsedAmount > 0 && parsedAmount % 1 !== 0
    ? roundUpTo(parsedAmount, parsedAmount < 20 ? 1 : 5)
    : null;

  const handleSave = () => {
    if (!valid) return;
    onSave({
      id: editing ? editing.id : uid(),
      amount: parseFloat(amount),
      category,
      date,
      merchant: merchant.trim() || catById(category).label,
      notes: notes.trim(),
      isAnomaly: editing ? editing.isAnomaly : false,
    });
    if (!editing) {
      setShowSuccess(true);
      setAmount(""); setMerchant(""); setNotes(""); setCategory("food");
      setDate(new Date().toISOString().slice(0, 10));
    }
  };

  if (showSuccess) {
    return (
      <div className="screen">
        <div className="success-burst">
          <div className="success-circle"><Check size={34} /></div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 21, fontWeight: 600 }}>Expense saved</div>
          <div style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 6, maxWidth: 260 }}>
            Your entry has been added to this month's ledger.
          </div>
          <button className="btn btn-primary" style={{ marginTop: 24, width: 200 }} onClick={() => setShowSuccess(false)}>
            Add another
          </button>
          <button className="btn btn-ghost" style={{ marginTop: 10, width: 200 }} onClick={() => onCancelEdit && onCancelEdit(true)}>
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="amount-input-wrap">
        <span className="sign">$</span>
        <input
          className="amount-input"
          inputMode="decimal"
          placeholder="0.00"
          value={amount}
          onChange={(e) => {
            const v = e.target.value.replace(/[^0-9.]/g, "");
            setAmount(v);
          }}
          autoFocus
        />
      </div>

      {roundSuggestion && (
        <div className="tip-banner">
          <Lightbulb size={17} color="var(--amber-dark)" style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 13, lineHeight: 1.4 }}>
            Pay <b>{fmtMoney(roundSuggestion.rounded)}</b> instead of {fmtMoney(parsedAmount)} and stash the{" "}
            <b>{fmtMoney(roundSuggestion.spare)}</b> change in savings.
          </div>
        </div>
      )}

      <div className="section-block" style={{ marginTop: 4 }}>
        <span className="field-label">Category</span>
        <div className="cat-grid">
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            return (
              <button
                key={c.id}
                type="button"
                className={`cat-chip ${category === c.id ? "active" : ""}`}
                onClick={() => setCategory(c.id)}
              >
                <div className="cat-chip-icon" style={{ background: c.color }}>
                  <Icon size={18} />
                </div>
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="section-block">
        <span className="field-label">Merchant</span>
        <input
          className="input"
          placeholder="Where did you spend?"
          value={merchant}
          onChange={(e) => setMerchant(e.target.value)}
        />
      </div>

      <div className="section-block">
        <span className="field-label">Date</span>
        <input
          type="date"
          className="input"
          value={date}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <div className="section-block">
        <span className="field-label">Notes</span>
        <textarea
          className="input"
          placeholder="Add a note (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div className="section-block" style={{ display: "flex", gap: 10 }}>
        {editing && (
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => onCancelEdit && onCancelEdit(false)}>
            Cancel
          </button>
        )}
        <button className="btn btn-primary" style={{ flex: editing ? 1 : "unset" }} disabled={!valid} onClick={handleSave}>
          {editing ? "Save changes" : "Save expense"}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Screen: Expense List                                                */
/* ------------------------------------------------------------------ */

const PAGE_SIZE = 8;

function ExpenseListScreen({ expenses, onOpenExpense }) {
  const [sortBy, setSortBy] = useState("date-desc");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ from: "", to: "", categories: [], min: "", max: "" });
  const [draftFilters, setDraftFilters] = useState(filters);

  const filtered = useMemo(() => {
    let list = [...expenses];
    if (filters.from) list = list.filter((e) => e.date >= filters.from);
    if (filters.to) list = list.filter((e) => e.date <= filters.to);
    if (filters.categories.length) list = list.filter((e) => filters.categories.includes(e.category));
    if (filters.min) list = list.filter((e) => e.amount >= parseFloat(filters.min));
    if (filters.max) list = list.filter((e) => e.amount <= parseFloat(filters.max));

    list.sort((a, b) => {
      if (sortBy === "date-desc") return new Date(b.date) - new Date(a.date);
      if (sortBy === "date-asc") return new Date(a.date) - new Date(b.date);
      if (sortBy === "amount-desc") return b.amount - a.amount;
      if (sortBy === "amount-asc") return a.amount - b.amount;
      return 0;
    });
    return list;
  }, [expenses, filters, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [filters, sortBy]);

  const activeFilterCount =
    (filters.from ? 1 : 0) + (filters.to ? 1 : 0) + filters.categories.length +
    (filters.min ? 1 : 0) + (filters.max ? 1 : 0);

  return (
    <div className="screen">
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <select className="input" style={{ flex: 1 }} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="date-desc">Newest first</option>
          <option value="date-asc">Oldest first</option>
          <option value="amount-desc">Amount: High to low</option>
          <option value="amount-asc">Amount: Low to high</option>
        </select>
        <button
          className="btn btn-ghost btn-sm"
          style={{ position: "relative", flexShrink: 0 }}
          onClick={() => { setDraftFilters(filters); setShowFilters(true); }}
        >
          <SlidersHorizontal size={15} /> Filter
          {activeFilterCount > 0 && (
            <span style={{
              position: "absolute", top: -6, right: -6, background: "var(--rust)", color: "#fff",
              borderRadius: "50%", width: 18, height: 18, fontSize: 10, display: "flex",
              alignItems: "center", justifyContent: "center", fontWeight: 700,
            }}>{activeFilterCount}</span>
          )}
        </button>
      </div>

      <div className="card" style={{ padding: "4px 16px" }}>
        {pageItems.length === 0 && (
          <div className="empty-state">
            <Receipt size={34} />
            <div style={{ fontWeight: 600, color: "var(--text)" }}>No expenses found</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Try adjusting your filters.</div>
          </div>
        )}
        {pageItems.map((e) => (
          <div className="expense-row dashed-row" key={e.id} onClick={() => onOpenExpense(e)}>
            <CategoryIcon id={e.category} />
            <div className="expense-mid">
              <div className="expense-merchant">
                {e.merchant}
                {e.isAnomaly && <AlertTriangle size={13} color="var(--rust)" />}
              </div>
              <div className="expense-meta">{fmtDate(e.date)} · {catById(e.category).label}</div>
            </div>
            <div className="expense-amt">{fmtMoney(e.amount)}</div>
          </div>
        ))}
      </div>

      {filtered.length > 0 && (
        <div className="pagination">
          <button className="page-btn" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft size={16} />
          </button>
          <span className="page-info">Page {page} of {totalPages}</span>
          <button className="page-btn" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {showFilters && (
        <div className="modal-overlay" onClick={() => setShowFilters(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-header">
              <div className="modal-title">Filter expenses</div>
              <button className="icon-btn" onClick={() => setShowFilters(false)}><X size={20} /></button>
            </div>

            <span className="field-label">Date range</span>
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <input type="date" className="input" value={draftFilters.from}
                onChange={(e) => setDraftFilters((f) => ({ ...f, from: e.target.value }))} />
              <input type="date" className="input" value={draftFilters.to}
                onChange={(e) => setDraftFilters((f) => ({ ...f, to: e.target.value }))} />
            </div>

            <span className="field-label">Category</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  className={`chip-toggle ${draftFilters.categories.includes(c.id) ? "active" : ""}`}
                  onClick={() => setDraftFilters((f) => ({
                    ...f,
                    categories: f.categories.includes(c.id)
                      ? f.categories.filter((x) => x !== c.id)
                      : [...f.categories, c.id],
                  }))}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <span className="field-label">Amount range</span>
            <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
              <input type="number" className="input" placeholder="Min $" value={draftFilters.min}
                onChange={(e) => setDraftFilters((f) => ({ ...f, min: e.target.value }))} />
              <input type="number" className="input" placeholder="Max $" value={draftFilters.max}
                onChange={(e) => setDraftFilters((f) => ({ ...f, max: e.target.value }))} />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                className="btn btn-ghost"
                style={{ flex: 1 }}
                onClick={() => setDraftFilters({ from: "", to: "", categories: [], min: "", max: "" })}
              >
                Reset
              </button>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={() => { setFilters(draftFilters); setShowFilters(false); }}
              >
                Apply filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ExpenseDetailModal({ expense, onClose, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  if (editing) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-sheet" onClick={(e) => e.stopPropagation()} style={{ maxHeight: "92vh" }}>
          <div className="modal-handle" />
          <div className="modal-header">
            <div className="modal-title">Edit expense</div>
            <button className="icon-btn" onClick={onClose}><X size={20} /></button>
          </div>
          <ExpenseEntryScreen
            editing={expense}
            onSave={(updated) => { onSave(updated); onClose(); }}
            onCancelEdit={() => setEditing(false)}
          />
        </div>
      </div>
    );
  }
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-header">
          <div className="modal-title">Expense detail</div>
          <button className="icon-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
          <CategoryIcon id={expense.category} size={20} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{expense.merchant}</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{catById(expense.category).label}</div>
          </div>
        </div>

        {expense.isAnomaly && (
          <div style={{ marginBottom: 14 }}>
            <span className="stamp"><AlertTriangle size={12} /> Unusual spend</span>
          </div>
        )}

        <div className="card" style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 0" }} className="dashed-row">
            <span style={{ color: "var(--text-muted)", fontSize: 13.5 }}>Amount</span>
            <span className="num" style={{ fontWeight: 700, fontSize: 16 }}>{fmtMoney(expense.amount)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 0" }} className="dashed-row">
            <span style={{ color: "var(--text-muted)", fontSize: 13.5 }}>Date</span>
            <span style={{ fontWeight: 600, fontSize: 14 }}>{fmtDate(expense.date)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 0" }}>
            <span style={{ color: "var(--text-muted)", fontSize: 13.5 }}>Notes</span>
            <span style={{ fontWeight: 500, fontSize: 14, textAlign: "right", maxWidth: 200 }}>
              {expense.notes || "—"}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-danger-ghost" style={{ flex: 1 }} onClick={() => { onDelete(expense.id); onClose(); }}>
            <Trash2 size={15} /> Delete
          </button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setEditing(true)}>
            <Pencil size={15} /> Edit
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Screen: Budget setup                                                */
/* ------------------------------------------------------------------ */

function BudgetSetupScreen({ budgets, onSave }) {
  const [draft, setDraft] = useState(budgets);
  const [saved, setSaved] = useState(false);
  const total = Object.values(draft).reduce((a, b) => a + (parseFloat(b) || 0), 0);

  return (
    <div className="screen">
      <div className="stat-hero" style={{ marginBottom: 20 }}>
        <div className="stat-hero-label">Total monthly budget</div>
        <div className="stat-hero-amount num">{fmtMoney(total)}</div>
      </div>

      <span className="section-title">Set a limit per category</span>
      <div className="card" style={{ padding: "4px 16px" }}>
        {CATEGORIES.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.id} className="dashed-row" style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 0" }}>
              <div className="cat-chip-icon" style={{ background: c.color, width: 32, height: 32, flexShrink: 0 }}>
                <Icon size={15} />
              </div>
              <div style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>{c.label}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 3, width: 100 }}>
                <span style={{ color: "var(--text-muted)" }}>$</span>
                <input
                  type="number"
                  className="input"
                  style={{ padding: "8px 8px", fontSize: 14 }}
                  value={draft[c.id]}
                  onChange={(e) => setDraft((d) => ({ ...d, [c.id]: e.target.value }))}
                />
              </div>
            </div>
          );
        })}
      </div>

      <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => { onSave(draft); setSaved(true); }}>
        Save budget
      </button>
      {saved && (
        <Toast message="Budget updated" onDone={() => setSaved(false)} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Screen: Receipt Review                                              */
/* ------------------------------------------------------------------ */

function ReceiptReviewScreen({ onConfirm }) {
  const [scanned, setScanned] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  const simulateScan = () => {
    const cat = CATEGORIES[Math.floor(Math.random() * (CATEGORIES.length - 1))];
    const merchant = MERCHANTS[cat.id][Math.floor(Math.random() * MERCHANTS[cat.id].length)];
    const items = [
      { name: "Item 1", price: (Math.random() * 20 + 4).toFixed(2) },
      { name: "Item 2", price: (Math.random() * 15 + 3).toFixed(2) },
      { name: "Item 3", price: (Math.random() * 10 + 2).toFixed(2) },
    ];
    const subtotal = items.reduce((a, b) => a + parseFloat(b.price), 0);
    const tax = subtotal * 0.08;
    setScanned({
      merchant, category: cat.id, date: new Date().toISOString().slice(0, 10),
      items, subtotal: subtotal.toFixed(2), tax: tax.toFixed(2),
      total: (subtotal + tax).toFixed(2),
    });
    setConfirmed(false);
  };

  const updateField = (field, value) => setScanned((s) => ({ ...s, [field]: value }));

  if (!scanned) {
    return (
      <div className="screen">
        <div className="empty-state" style={{ paddingTop: 40 }}>
          <Camera size={40} />
          <div style={{ fontWeight: 700, color: "var(--text)", fontSize: 17, fontFamily: "'Fraunces', serif" }}>
            Scan a receipt
          </div>
          <div style={{ fontSize: 13.5, marginTop: 6, maxWidth: 260, marginInline: "auto" }}>
            Snap a photo and we'll pull out the merchant, date, and total for you to review.
          </div>
          <button className="btn btn-amber" style={{ marginTop: 22 }} onClick={simulateScan}>
            <Camera size={16} /> Simulate scan
          </button>
        </div>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="screen">
        <div className="success-burst">
          <div className="success-circle"><Check size={34} /></div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 21, fontWeight: 600 }}>Receipt saved</div>
          <div style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 6, maxWidth: 260 }}>
            Added to your expenses from {scanned.merchant}.
          </div>
          <button className="btn btn-primary" style={{ marginTop: 24, width: 220 }} onClick={() => setScanned(null)}>
            Scan another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <div style={{ marginBottom: 14 }}>
        <span className="stamp" style={{ color: "var(--sage)", borderColor: "var(--sage)" }}>
          <Sparkles size={12} /> Auto-detected · review below
        </span>
      </div>

      <div className="receipt-card">
        <div style={{ textAlign: "center", marginBottom: 14 }}>
          <input
            className="input"
            style={{ textAlign: "center", fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 17, border: "none", background: "transparent" }}
            value={scanned.merchant}
            onChange={(e) => updateField("merchant", e.target.value)}
          />
        </div>
        {scanned.items.map((it, idx) => (
          <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, padding: "5px 0", color: "var(--text-muted)" }}>
            <span>{it.name}</span>
            <span className="num">${it.price}</span>
          </div>
        ))}
        <div style={{ borderTop: "1px dashed var(--line-strong)", marginTop: 8, paddingTop: 8, display: "flex", justifyContent: "space-between", fontSize: 13.5 }}>
          <span>Subtotal</span><span className="num">${scanned.subtotal}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, marginTop: 4 }}>
          <span>Tax</span><span className="num">${scanned.tax}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 17, marginTop: 8 }}>
          <span>Total</span><span className="num">${scanned.total}</span>
        </div>
      </div>

      <div className="section-block">
        <span className="field-label">Category</span>
        <select className="input" value={scanned.category} onChange={(e) => updateField("category", e.target.value)}>
          {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      </div>
      <div className="section-block">
        <span className="field-label">Date</span>
        <input type="date" className="input" value={scanned.date} onChange={(e) => updateField("date", e.target.value)} />
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setScanned(null)}>Discard</button>
        <button
          className="btn btn-primary"
          style={{ flex: 1 }}
          onClick={() => {
            onConfirm({
              id: uid(), amount: parseFloat(scanned.total), category: scanned.category,
              date: scanned.date, merchant: scanned.merchant, notes: "From scanned receipt", isAnomaly: false,
            });
            setConfirmed(true);
          }}
        >
          Confirm & save
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Screen: Split Expense                                               */
/* ------------------------------------------------------------------ */

function SplitExpenseScreen({ expenses, contacts, onSplitSaved }) {
  const [expenseId, setExpenseId] = useState(expenses[0]?.id || "");
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [splitType, setSplitType] = useState("even");
  const [customAmounts, setCustomAmounts] = useState({});
  const [saved, setSaved] = useState(false);

  const expense = expenses.find((e) => e.id === expenseId);
  const includeMe = true;
  const participantCount = selectedContacts.length + (includeMe ? 1 : 0);

  const evenShare = expense && participantCount > 0 ? expense.amount / participantCount : 0;

  const customTotal = Object.values(customAmounts).reduce((a, b) => a + (parseFloat(b) || 0), 0);
  const remaining = expense ? expense.amount - customTotal : 0;

  const toggleContact = (id) => {
    setSelectedContacts((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  if (!expense) {
    return (
      <div className="screen">
        <div className="empty-state">
          <Split size={34} />
          <div style={{ fontWeight: 700, color: "var(--text)" }}>No expenses to split</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Add an expense first.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <span className="field-label">Expense to split</span>
      <select className="input" value={expenseId} onChange={(e) => setExpenseId(e.target.value)} style={{ marginBottom: 18 }}>
        {expenses.map((e) => (
          <option key={e.id} value={e.id}>{e.merchant} · {fmtMoney(e.amount)} · {fmtDateShort(e.date)}</option>
        ))}
      </select>

      <div className="card" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <CategoryIcon id={expense.category} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700 }}>{expense.merchant}</div>
          <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{fmtDate(expense.date)}</div>
        </div>
        <div className="num" style={{ fontWeight: 700, fontSize: 18 }}>{fmtMoney(expense.amount)}</div>
      </div>

      <span className="field-label">Split with</span>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
        {contacts.map((c) => (
          <button key={c.id} className={`chip-toggle ${selectedContacts.includes(c.id) ? "active" : ""}`} onClick={() => toggleContact(c.id)}>
            <span className="avatar" style={{ width: 20, height: 20, fontSize: 9, background: c.color }}>
              {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </span>
            {c.name}
          </button>
        ))}
      </div>

      <span className="field-label">Split method</span>
      <div className="segmented" style={{ marginBottom: 18 }}>
        <button className={splitType === "even" ? "active" : ""} onClick={() => setSplitType("even")}>Split evenly</button>
        <button className={splitType === "custom" ? "active" : ""} onClick={() => setSplitType("custom")}>Custom amounts</button>
      </div>

      {selectedContacts.length === 0 && (
        <div className="empty-state" style={{ padding: "20px 10px" }}>
          Select at least one contact to split this expense with.
        </div>
      )}

      {selectedContacts.length > 0 && splitType === "even" && (
        <div className="card">
          <div className="dashed-row" style={{ display: "flex", justifyContent: "space-between", padding: "10px 0" }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>You</span>
            <span className="num" style={{ fontWeight: 700 }}>{fmtMoney(evenShare)}</span>
          </div>
          {selectedContacts.map((id) => {
            const c = contacts.find((x) => x.id === id);
            return (
              <div className="dashed-row" key={id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0" }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</span>
                <span className="num" style={{ fontWeight: 700 }}>{fmtMoney(evenShare)}</span>
              </div>
            );
          })}
        </div>
      )}

      {selectedContacts.length > 0 && splitType === "custom" && (
        <div className="card">
          {selectedContacts.map((id) => {
            const c = contacts.find((x) => x.id === id);
            return (
              <div className="dashed-row" key={id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0" }}>
                <span style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>{c.name}</span>
                <input
                  type="number"
                  className="input"
                  style={{ width: 90, padding: "8px 8px" }}
                  placeholder="$0.00"
                  value={customAmounts[id] || ""}
                  onChange={(e) => setCustomAmounts((a) => ({ ...a, [id]: e.target.value }))}
                />
              </div>
            );
          })}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 0", fontSize: 13, fontWeight: 600, color: remaining < 0 ? "var(--rust)" : "var(--text-muted)" }}>
            <span>Remaining for you</span>
            <span className="num">{fmtMoney(remaining)}</span>
          </div>
        </div>
      )}

      {selectedContacts.length > 0 && (
        <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => { onSplitSaved(); setSaved(true); }}>
          Save split
        </button>
      )}
      {saved && <Toast message="Split saved" onDone={() => setSaved(false)} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Screen: Contacts Management                                        */
/* ------------------------------------------------------------------ */

const AVATAR_COLORS = ["#BE4B32", "#3D6B8A", "#7C9A82", "#B98A3E", "#8A5C9E", "#C79226", "#356B5D"];

function ContactsScreen({ contacts, setContacts }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState(AVATAR_COLORS[0]);

  const openAdd = () => { setName(""); setColor(AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]); setEditingContact(null); setShowAdd(true); };
  const openEdit = (c) => { setName(c.name); setColor(c.color); setEditingContact(c); setShowAdd(true); };

  const save = () => {
    if (!name.trim()) return;
    if (editingContact) {
      setContacts((cs) => cs.map((c) => (c.id === editingContact.id ? { ...c, name: name.trim(), color } : c)));
    } else {
      setContacts((cs) => [...cs, { id: uid(), name: name.trim(), color }]);
    }
    setShowAdd(false);
  };

  const remove = (id) => setContacts((cs) => cs.filter((c) => c.id !== id));

  return (
    <div className="screen">
      <button className="btn btn-primary" style={{ marginBottom: 18 }} onClick={openAdd}>
        <UserPlus size={16} /> Add contact
      </button>

      <div className="card" style={{ padding: "4px 16px" }}>
        {contacts.length === 0 && (
          <div className="empty-state"><Users size={30} /><div>No contacts yet</div></div>
        )}
        {contacts.map((c) => (
          <div key={c.id} className="dashed-row" style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 0" }}>
            <div className="avatar" style={{ background: c.color }}>
              {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <div style={{ flex: 1, fontWeight: 600, fontSize: 14.5 }}>{c.name}</div>
            <button className="icon-btn" onClick={() => openEdit(c)}><Pencil size={16} /></button>
            <button className="icon-btn" onClick={() => remove(c.id)}><Trash2 size={16} color="var(--rust)" /></button>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-header">
              <div className="modal-title">{editingContact ? "Edit contact" : "Add contact"}</div>
              <button className="icon-btn" onClick={() => setShowAdd(false)}><X size={20} /></button>
            </div>
            <span className="field-label">Name</span>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" style={{ marginBottom: 16 }} />
            <span className="field-label">Avatar color</span>
            <div style={{ display: "flex", gap: 10, marginBottom: 22 }}>
              {AVATAR_COLORS.map((cl) => (
                <button
                  key={cl}
                  onClick={() => setColor(cl)}
                  style={{
                    width: 32, height: 32, borderRadius: "50%", background: cl, border: color === cl ? "3px solid var(--ink)" : "3px solid transparent",
                    cursor: "pointer",
                  }}
                />
              ))}
            </div>
            <button className="btn btn-primary" onClick={save}>{editingContact ? "Save changes" : "Add contact"}</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Screen: Coupons & Cashback                                          */
/* ------------------------------------------------------------------ */

const COUPON_FILTERS = ["all", "food", "groceries", "transport", "shopping", "entertainment", "bills", "health", "travel"];

function CouponsScreen({ coupons }) {
  const [filter, setFilter] = useState("all");
  const [copiedId, setCopiedId] = useState(null);

  const visible = filter === "all" ? coupons : coupons.filter((c) => c.category === filter);

  const copyCode = async (coupon) => {
    try {
      await navigator.clipboard.writeText(coupon.code);
    } catch (e) {
      /* clipboard may be unavailable; UI still confirms visually */
    }
    setCopiedId(coupon.id);
    setTimeout(() => setCopiedId((id) => (id === coupon.id ? null : id)), 1600);
  };

  return (
    <div className="screen">
      <div className="stat-hero" style={{ marginBottom: 18 }}>
        <div className="stat-hero-label">Available offers</div>
        <div className="stat-hero-amount num">{coupons.length}</div>
        <div style={{ fontSize: 12.5, opacity: 0.8, marginTop: 6 }}>
          across {new Set(coupons.map((c) => c.category)).size} categories
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 16 }}>
        {COUPON_FILTERS.map((f) => (
          <button
            key={f}
            className={`chip-toggle ${filter === f ? "active" : ""}`}
            style={{ flexShrink: 0 }}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "All brands" : catById(f).label}
          </button>
        ))}
      </div>

      {visible.length === 0 && (
        <div className="empty-state"><Gift size={30} /><div>No offers in this category yet</div></div>
      )}

      {visible.map((c) => (
        <div className="coupon-card" key={c.id}>
          <div className="coupon-brand" style={{ background: c.color }}>
            {c.brand.split(" ").map((w) => w[0]).join("").slice(0, 2)}
          </div>
          <div className="coupon-body">
            <div className="coupon-discount">{c.discount}</div>
            <div className="coupon-detail">{c.brand} · {c.detail}</div>
            <div className="coupon-footer">
              <span className="coupon-code">{c.code}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="coupon-expiry">{c.expiresInDays}d left</span>
                <button className={`copy-btn ${copiedId === c.id ? "copied" : ""}`} onClick={() => copyCode(c)}>
                  {copiedId === c.id ? <Check size={13} /> : <Copy size={13} />}
                  {copiedId === c.id ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Screen: Round-Up Savings                                            */
/* ------------------------------------------------------------------ */

function RoundUpScreen({ expenses }) {
  const [nearest, setNearest] = useState(1);
  const [autoRoundUp, setAutoRoundUp] = useState(true);

  const now = new Date();
  const curKey = monthKey(now);
  const thisMonthExpenses = expenses.filter((e) => monthKey(e.date) === curKey);

  const roundUps = useMemo(() => {
    return thisMonthExpenses
      .map((e) => ({ expense: e, ...roundUpTo(e.amount, nearest) }))
      .filter((r) => r.spare > 0.004)
      .sort((a, b) => b.spare - a.spare);
  }, [thisMonthExpenses, nearest]);

  const totalSpare = roundUps.reduce((a, r) => a + r.spare, 0);

  return (
    <div className="screen">
      <div className="stat-hero" style={{ marginBottom: 18 }}>
        <div className="stat-hero-label">Spare change saved this month</div>
        <div className="stat-hero-amount num">{fmtMoney(totalSpare)}</div>
        <div style={{ fontSize: 12.5, opacity: 0.8, marginTop: 6 }}>
          from {roundUps.length} rounded-up purchases
        </div>
      </div>

      <div className="tip-banner">
        <Coins size={17} color="var(--amber-dark)" style={{ flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: 13, lineHeight: 1.4 }}>
          Pay bills in round figures and let the leftover change go straight into savings —
          small amounts add up fast.
        </div>
      </div>

      <div className="section-block">
        <span className="field-label">Round up to nearest</span>
        <div className="segmented">
          <button className={nearest === 1 ? "active" : ""} onClick={() => setNearest(1)}>$1</button>
          <button className={nearest === 5 ? "active" : ""} onClick={() => setNearest(5)}>$5</button>
          <button className={nearest === 10 ? "active" : ""} onClick={() => setNearest(10)}>$10</button>
        </div>
      </div>

      <div className="section-block card" style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Auto round-up recommendations</div>
          <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>
            Show a savings tip every time you log a new expense
          </div>
        </div>
        <button
          onClick={() => setAutoRoundUp((v) => !v)}
          style={{
            width: 46, height: 26, borderRadius: 20, border: "none", cursor: "pointer",
            background: autoRoundUp ? "var(--ink)" : "var(--line-strong)", position: "relative", flexShrink: 0,
          }}
        >
          <span style={{
            position: "absolute", top: 3, left: autoRoundUp ? 23 : 3, width: 20, height: 20, borderRadius: "50%",
            background: "#fff", transition: "left .15s ease",
          }} />
        </button>
      </div>

      <div className="section-block">
        <div className="section-title">This month's round-ups</div>
        <div className="card" style={{ padding: "4px 16px" }}>
          {roundUps.length === 0 && (
            <div className="empty-state" style={{ padding: "20px 10px" }}>
              No spare change yet — expenses with whole-dollar amounts won't round up.
            </div>
          )}
          {roundUps.map((r) => (
            <div key={r.expense.id} className="dashed-row roundup-row">
              <CategoryIcon id={r.expense.category} size={15} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{r.expense.merchant}</div>
                <div style={{ fontSize: 11.5 }}>
                  <span className="roundup-old num">{fmtMoney(r.expense.amount)}</span>{" "}
                  → <span className="roundup-new num">{fmtMoney(r.rounded)}</span>
                </div>
              </div>
              <span className="roundup-spare num">+{fmtMoney(r.spare)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Screen: Challenges & Streaks                                        */
/* ------------------------------------------------------------------ */

const CHALLENGE_ICONS = { flame: Flame, target: Target, trophy: Trophy };

function ChallengesScreen({ challenges, setChallenges }) {
  const [celebrate, setCelebrate] = useState(null);

  const startChallenge = (id) => {
    setChallenges((cs) => cs.map((c) => (c.id === id ? { ...c, active: true } : c)));
  };

  const logToday = (id) => {
    setChallenges((cs) => cs.map((c) => {
      if (c.id !== id) return c;
      const nextSaved = Math.min(c.goal, Math.round((c.saved + c.goal * 0.12) * 100) / 100);
      return { ...c, streak: c.streak + 1, saved: nextSaved };
    }));
    setCelebrate(id);
    setTimeout(() => setCelebrate(null), 1800);
  };

  const active = challenges.filter((c) => c.active);
  const suggestions = challenges.filter((c) => !c.active);
  const bestStreak = Math.max(0, ...challenges.map((c) => c.streak));

  return (
    <div className="screen">
      <div className="stat-hero" style={{ marginBottom: 18 }}>
        <div className="stat-hero-label">Longest active streak</div>
        <div className="stat-hero-amount num" style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          {bestStreak}<span style={{ fontSize: 16, fontWeight: 500 }}>days</span>
        </div>
      </div>

      {active.length > 0 && (
        <div className="section-block">
          <div className="section-title">Your active challenges</div>
          {active.map((c) => {
            const Icon = CHALLENGE_ICONS[c.icon] || Flame;
            const pct = Math.min(100, Math.round((c.saved / c.goal) * 100));
            return (
              <div className="challenge-card" key={c.id}>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div className="challenge-icon" style={{ background: "var(--ink)" }}><Icon size={17} /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{c.title}</div>
                    <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>{c.desc}</div>
                  </div>
                  <span className="streak-badge"><Flame size={13} /> {c.streak}d</span>
                </div>
                <div className="progress-track"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 12.5, color: "var(--text-muted)" }}>
                  <span className="num">{fmtMoney(c.saved)} of {fmtMoney(c.goal)}</span>
                  <span>{pct}%</span>
                </div>
                {celebrate === c.id ? (
                  <div className="tip-banner" style={{ marginTop: 12 }}>
                    <PartyPopper size={16} color="var(--amber-dark)" />
                    <div style={{ fontSize: 13 }}>Nice work — streak extended to <b>{c.streak} days</b>!</div>
                  </div>
                ) : (
                  <button className="btn btn-amber" style={{ width: "100%", marginTop: 12 }} onClick={() => logToday(c.id)}>
                    <Flame size={15} /> Log today & extend streak
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="section-block">
          <div className="section-title">More challenges to try</div>
          {suggestions.map((c) => {
            const Icon = CHALLENGE_ICONS[c.icon] || Target;
            return (
              <div className="challenge-card" key={c.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div className="challenge-icon" style={{ background: "var(--sage)" }}><Icon size={17} /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14.5 }}>{c.title}</div>
                  <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>{c.desc}</div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => startChallenge(c.id)}>Start</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Screen: Home Dashboard                                              */
/* ------------------------------------------------------------------ */

function DashboardScreen({ expenses, budgets, onNavigate }) {
  const now = new Date();
  const curKey = monthKey(now);
  const thisMonthExpenses = expenses.filter((e) => monthKey(e.date) === curKey);
  const totalThisMonth = thisMonthExpenses.reduce((a, e) => a + e.amount, 0);

  const pieData = useMemo(() => {
    const byCat = {};
    thisMonthExpenses.forEach((e) => { byCat[e.category] = (byCat[e.category] || 0) + e.amount; });
    return Object.entries(byCat)
      .map(([id, value]) => ({ id, name: catById(id).label, value, color: catById(id).color }))
      .sort((a, b) => b.value - a.value);
  }, [thisMonthExpenses]);

  const trendData = useMemo(() => {
    const byMonth = {};
    expenses.forEach((e) => {
      const k = monthKey(e.date);
      byMonth[k] = (byMonth[k] || 0) + e.amount;
    });
    return Object.entries(byMonth).sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([k, v]) => ({ month: monthLabel(k), total: Math.round(v) }));
  }, [expenses]);

  const budgetVsActual = useMemo(() => {
    return CATEGORIES.map((c) => ({
      name: c.label.split(" ")[0],
      budget: parseFloat(budgets[c.id]) || 0,
      actual: Math.round(thisMonthExpenses.filter((e) => e.category === c.id).reduce((a, e) => a + e.amount, 0)),
    })).filter((d) => d.budget > 0 || d.actual > 0);
  }, [budgets, thisMonthExpenses]);

  const topMerchants = useMemo(() => {
    const byMerchant = {};
    thisMonthExpenses.forEach((e) => { byMerchant[e.merchant] = (byMerchant[e.merchant] || 0) + e.amount; });
    return Object.entries(byMerchant).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [thisMonthExpenses]);

  const anomalies = expenses.filter((e) => e.isAnomaly);

  return (
    <div className="screen">
      <div className="stat-hero">
        <div className="stat-hero-label">Spent this month</div>
        <div className="stat-hero-amount num">{fmtMoney(totalThisMonth)}</div>
        <div style={{ fontSize: 12.5, opacity: 0.8, marginTop: 6 }}>
          across {thisMonthExpenses.length} expenses
        </div>
      </div>

      {anomalies.length > 0 && (
        <div className="section-block">
          <div className="card" style={{ borderColor: "rgba(190,75,50,0.35)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span className="stamp"><AlertTriangle size={12} /> Anomaly detected</span>
            </div>
            {anomalies.slice(0, 1).map((e) => (
              <div key={e.id} className="anomaly-list-item">
                <CategoryIcon id={e.category} size={16} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{e.merchant} — {fmtMoney(e.amount)}</div>
                  <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
                    Unusually high for {catById(e.category).label} on {fmtDate(e.date)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="section-block">
        <div className="section-title">Where it went</div>
        <div className="card">
          {pieData.length === 0 ? (
            <div className="empty-state" style={{ padding: "20px 10px" }}>No expenses logged this month yet.</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={190}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={78} paddingAngle={2}>
                    {pieData.map((d, i) => <Cell key={i} fill={d.color} stroke="var(--card)" strokeWidth={2} />)}
                  </Pie>
                  <Tooltip formatter={(v) => fmtMoney(v)} contentStyle={{ fontFamily: "Inter", fontSize: 12, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", marginTop: 6, justifyContent: "center" }}>
                {pieData.map((d) => (
                  <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: d.color }} />
                    {d.name}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="section-block">
        <div className="section-title">Monthly trend</div>
        <div className="card">
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={trendData} margin={{ left: -18, right: 10, top: 10 }}>
              <CartesianGrid stroke="var(--line)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} width={45} />
              <Tooltip formatter={(v) => fmtMoney(v)} contentStyle={{ fontFamily: "Inter", fontSize: 12, borderRadius: 8 }} />
              <Line type="monotone" dataKey="total" stroke="var(--ink)" strokeWidth={2.5} dot={{ r: 3, fill: "var(--amber)" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="section-block">
        <div className="section-title">Budget vs actual</div>
        <div className="card">
          {budgetVsActual.length === 0 ? (
            <div className="empty-state" style={{ padding: "20px 10px" }}>Set a budget to compare against spending.</div>
          ) : (
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={budgetVsActual} margin={{ left: -18, right: 10, top: 10 }}>
                <CartesianGrid stroke="var(--line)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10.5, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} interval={0} angle={-25} textAnchor="end" height={45} />
                <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} width={42} />
                <Tooltip formatter={(v) => fmtMoney(v)} contentStyle={{ fontFamily: "Inter", fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="budget" fill="var(--line-strong)" radius={[4, 4, 0, 0]} maxBarSize={14} />
                <Bar dataKey="actual" fill="var(--amber)" radius={[4, 4, 0, 0]} maxBarSize={14} />
              </BarChart>
            </ResponsiveContainer>
          )}
          <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--line-strong)" }} /> Budget
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--amber)" }} /> Actual
            </div>
          </div>
        </div>
      </div>

      <div className="section-block">
        <div className="section-title">Top merchants</div>
        <div className="card" style={{ padding: "4px 16px" }}>
          {topMerchants.length === 0 ? (
            <div className="empty-state" style={{ padding: "20px 10px" }}>No merchants yet this month.</div>
          ) : topMerchants.map((m, i) => (
            <div key={m.name} className="dashed-row" style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0" }}>
              <div style={{
                width: 26, height: 26, borderRadius: "50%", background: "var(--paper)", border: "1px solid var(--line-strong)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "var(--ink)", flexShrink: 0,
              }}>{i + 1}</div>
              <Store size={15} color="var(--text-muted)" />
              <div style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>{m.name}</div>
              <div className="num" style={{ fontWeight: 700 }}>{fmtMoney(m.total)}</div>
            </div>
          ))}
        </div>
      </div>

      <button className="btn btn-ghost" style={{ marginTop: 22 }} onClick={() => onNavigate("list")}>
        View all expenses <ArrowRight size={15} />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Screen: More menu                                                   */
/* ------------------------------------------------------------------ */

function MoreScreen({ onNavigate }) {
  const items = [
    { key: "receipt", label: "Receipt review", desc: "Scan & confirm receipts", icon: Camera },
    { key: "split", label: "Split expense", desc: "Divide costs with others", icon: Split },
    { key: "contacts", label: "Contacts", desc: "Manage people you split with", icon: Users },
    { key: "budget", label: "Budget setup", desc: "Set category limits", icon: PiggyBank },
    { key: "coupons", label: "Coupons & cashback", desc: "Brand offers to cut spending", icon: Gift },
    { key: "roundup", label: "Round-up savings", desc: "Turn spare change into savings", icon: Coins },
    { key: "challenges", label: "Challenges & streaks", desc: "Save more, build a streak", icon: Flame },
  ];
  return (
    <div className="screen">
      <div className="more-grid">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <div key={it.key} className="more-card" onClick={() => onNavigate(it.key)}>
              <div className="more-icon"><Icon size={18} /></div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14.5 }}>{it.label}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{it.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Root App                                                            */
/* ------------------------------------------------------------------ */

const SCREEN_META = {
  home: { title: "Ledger", subtitle: () => new Date().toLocaleDateString(undefined, { month: "long", year: "numeric" }) },
  entry: { title: "Add expense", subtitle: () => "Fast entry" },
  list: { title: "Expenses", subtitle: () => "Sorted & filtered" },
  more: { title: "More", subtitle: () => "Tools & settings" },
  budget: { title: "Budget setup", subtitle: () => "Monthly limits", back: "more" },
  receipt: { title: "Receipt review", subtitle: () => "Scan & confirm", back: "more" },
  split: { title: "Split expense", subtitle: () => "Share with contacts", back: "more" },
  contacts: { title: "Contacts", subtitle: () => "People you split with", back: "more" },
  coupons: { title: "Coupons & cashback", subtitle: () => "Save on every brand", back: "more" },
  roundup: { title: "Round-up savings", subtitle: () => "Spare change, real savings", back: "more" },
  challenges: { title: "Challenges & streaks", subtitle: () => "Stay consistent, save more", back: "more" },
};

export default function App() {
  const [screen, setScreen] = useState("home");
  const [expenses, setExpenses] = useState(seedExpenses);
  const [budgets, setBudgets] = useState(seedBudgets);
  const [contacts, setContacts] = useState(seedContacts);
  const [coupons] = useState(seedCoupons);
  const [challenges, setChallenges] = useState(seedChallenges);
  const [detailExpense, setDetailExpense] = useState(null);
  const [toast, setToast] = useState(null);

  const addOrUpdateExpense = (exp) => {
    setExpenses((list) => {
      const exists = list.some((e) => e.id === exp.id);
      return exists ? list.map((e) => (e.id === exp.id ? exp : e)) : [exp, ...list];
    });
  };

  const deleteExpense = (id) => setExpenses((list) => list.filter((e) => e.id !== id));

  const meta = SCREEN_META[screen];

  const TABS = [
    { key: "home", label: "Home", icon: Home },
    { key: "list", label: "Expenses", icon: ListOrdered },
    { key: "entry", label: "Add", icon: PlusCircle, isFab: true },
    { key: "more", label: "More", icon: MoreHorizontal },
  ];

  return (
    <div className="ledger-app">
      <GlobalStyle />
      <div className="ledger-shell">
        <TopBar
          title={meta.title}
          subtitle={meta.subtitle()}
          onBack={meta.back ? () => setScreen(meta.back) : undefined}
        />

        {screen === "home" && <DashboardScreen expenses={expenses} budgets={budgets} onNavigate={setScreen} />}

        {screen === "entry" && (
          <ExpenseEntryScreen
            onSave={(exp) => { addOrUpdateExpense(exp); }}
            onCancelEdit={() => setScreen("home")}
          />
        )}

        {screen === "list" && (
          <ExpenseListScreen expenses={expenses} onOpenExpense={setDetailExpense} />
        )}

        {screen === "more" && <MoreScreen onNavigate={setScreen} />}

        {screen === "budget" && <BudgetSetupScreen budgets={budgets} onSave={setBudgets} />}

        {screen === "receipt" && (
          <ReceiptReviewScreen onConfirm={(exp) => addOrUpdateExpense(exp)} />
        )}

        {screen === "split" && (
          <SplitExpenseScreen
            expenses={expenses}
            contacts={contacts}
            onSplitSaved={() => {}}
          />
        )}

        {screen === "contacts" && (
          <ContactsScreen contacts={contacts} setContacts={setContacts} />
        )}

        {screen === "coupons" && <CouponsScreen coupons={coupons} />}

        {screen === "roundup" && <RoundUpScreen expenses={expenses} />}

        {screen === "challenges" && (
          <ChallengesScreen challenges={challenges} setChallenges={setChallenges} />
        )}

        <div className="tabbar">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = screen === t.key || (t.key === "more" && ["budget", "receipt", "split", "contacts", "coupons", "roundup", "challenges"].includes(screen));
            if (t.isFab) {
              return (
                <button key={t.key} className="tab-btn" onClick={() => setScreen("entry")}>
                  <div className="fab"><PlusCircle size={22} /></div>
                </button>
              );
            }
            return (
              <button key={t.key} className={`tab-btn ${active ? "active" : ""}`} onClick={() => setScreen(t.key)}>
                <Icon size={19} />
                {t.label}
                {active && <span className="dot" />}
              </button>
            );
          })}
        </div>
      </div>

      {detailExpense && (
        <ExpenseDetailModal
          expense={detailExpense}
          onClose={() => setDetailExpense(null)}
          onSave={addOrUpdateExpense}
          onDelete={deleteExpense}
        />
      )}
    </div>
  );
}
