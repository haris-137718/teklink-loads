import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Truck, Package, DollarSign, FileText, Upload, CheckCircle2, Search, Plus,
  Pencil, Trash2, X, Lock, Building2, Calendar, TrendingUp, Download,
  ChevronLeft, Copy, AlertTriangle, Loader2, Eye, Users, Gauge, LogOut
} from "lucide-react";

/* ---------------------------------- helpers ---------------------------------- */

const uid = () => `id_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

const fmtMoney = (n) => {
  const num = Number(n) || 0;
  return num.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const fmtDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const todayISO = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const parseISO = (iso) => new Date(iso + "T00:00:00");

const getWeekRange = (refDate) => {
  const d = new Date(refDate);
  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
};

const getMonthRange = (refDate) => {
  const d = new Date(refDate);
  const start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
};

const daysBetween = (a, b) => Math.floor((b - a) / (1000 * 60 * 60 * 24));

const US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"];

/* ---------------------------------- storage ---------------------------------- */
/* Backed by a Netlify Function (netlify/functions/storage.js) + Netlify Blobs,
   so every visitor reads and writes the same shared data. */

const STORAGE_API = "/.netlify/functions/storage";

const storageGet = async (key) => {
  try {
    const res = await fetch(`${STORAGE_API}?key=${encodeURIComponent(key)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.value ?? null;
  } catch (e) {
    return null;
  }
};
const storageSet = async (key, value) => {
  try {
    const res = await fetch(STORAGE_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
    return res.ok;
  } catch (e) {
    return false;
  }
};
const storageDelete = async (key) => {
  try {
    const res = await fetch(`${STORAGE_API}?key=${encodeURIComponent(key)}`, { method: "DELETE" });
    return res.ok;
  } catch (e) {
    return false;
  }
};

/* ---------------------------------- seed data ---------------------------------- */

const SEED_CARRIER_ID = "carrier_seed_1";
const SEED_CARRIERS = [{ id: SEED_CARRIER_ID, name: "Demo Carrier — rename me", email: "demo@carrier.com", password: "1234", hasInvoice: false, createdAt: todayISO() }];

const SEED_LOADS = [
  { loadNumber: "36090509", origin: "WA", destination: "WA", rate: 200, date: "2026-03-23", dispatchFee: 14, feeStatus: "paid" },
  { loadNumber: "36107532", origin: "WA", destination: "OR", rate: 400, date: "2026-03-24", dispatchFee: 28, feeStatus: "paid" },
  { loadNumber: "36109756", origin: "WA", destination: "WA", rate: 500, date: "2026-03-26", dispatchFee: 35, feeStatus: "paid" },
  { loadNumber: "36096282", origin: "WA", destination: "OR", rate: 700, date: "2026-03-27", dispatchFee: 49, feeStatus: "paid" },
  { loadNumber: "36147368", origin: "WA", destination: "WA", rate: 250, date: "2026-03-27", dispatchFee: 17.5, feeStatus: "paid" },
  { loadNumber: "1046357", origin: "OR", destination: "WA", rate: 650, date: "2026-07-01", dispatchFee: 42.25, feeStatus: "paid" },
  { loadNumber: "127404", origin: "WA", destination: "MT", rate: 2000, date: "2026-07-06", dispatchFee: 140, feeStatus: "paid" },
  { loadNumber: "37500107", origin: "WA", destination: "WA", rate: 700, date: "2026-07-09", dispatchFee: 49, feeStatus: "paid" },
  { loadNumber: "127653", origin: "WA", destination: "WA", rate: 900, date: "2026-07-10", dispatchFee: 63, feeStatus: "paid" },
  { loadNumber: "37551853", origin: "WA", destination: "ID", rate: 1200, date: "2026-07-13", dispatchFee: 84, feeStatus: "unpaid" },
  { loadNumber: "1930187", origin: "WA", destination: "OR", rate: 550, date: "2026-07-15", dispatchFee: 38.5, feeStatus: "unpaid" },
].map((l, i) => ({
  id: `load_seed_${i + 1}`,
  carrierId: SEED_CARRIER_ID,
  notes: "",
  broker: "",
  ...l,
  createdAt: todayISO(),
  updatedAt: todayISO(),
}));

/* ---------------------------------- CSS ---------------------------------- */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&display=swap');

:root {
  --bg: #0a0e1a;
  --bg-grad-2: #121a2e;
  --panel: #151d30;
  --panel-alt: #1c2640;
  --border: #2a3552;
  --text: #eef1fb;
  --text-muted: #93a0c2;
  --accent: #7c5cff;
  --accent-strong: #5a37e8;
  --accent-glow: #22d3ee;
  --success: #34d399;
  --danger: #fb7185;
  --shadow: 0 14px 40px rgba(0,0,0,0.5);
  --shadow-sm: 0 6px 18px rgba(0,0,0,0.4);
}
* { box-sizing: border-box; }
.app-shell { font-family: 'Inter', system-ui, -apple-system, sans-serif; background: radial-gradient(1200px 600px at 12% -10%, rgba(124,92,255,0.22), transparent 60%), radial-gradient(1000px 520px at 100% 0%, rgba(34,211,238,0.14), transparent 55%), linear-gradient(180deg, var(--bg) 0%, var(--bg-grad-2) 100%); background-attachment: fixed; color: var(--text); min-height: 100vh; padding-bottom: 48px; }
.center-screen { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; padding: 24px; text-align: center; }
.screen-pad { padding: 20px 16px 12px; max-width: 900px; margin: 0 auto; }
.section-title { font-family: 'Oswald', sans-serif; text-transform: uppercase; letter-spacing: 0.04em; font-weight: 600; font-size: 1.1rem; display: flex; align-items: center; gap: 8px; margin: 4px 0 14px; }
.muted-text { color: var(--text-muted); font-size: 0.82rem; }
.error-text { color: var(--danger); font-size: 0.85rem; }
.hint-text { color: var(--text-muted); font-size: 0.78rem; max-width: 260px; }

.landing-badge { width: 60px; height: 60px; border-radius: 16px; background: linear-gradient(145deg, var(--accent-glow), var(--accent) 55%, var(--accent-strong)); display: flex; align-items: center; justify-content: center; color: #ffffff; box-shadow: 0 10px 32px rgba(124,92,255,0.45); }
.landing-title { font-family: 'Oswald', sans-serif; font-weight: 700; font-size: 2rem; text-transform: uppercase; letter-spacing: 0.03em; margin: 4px 0 0; }
.landing-sub { color: var(--text-muted); margin: 0 0 10px; }
.landing-actions { display: flex; flex-direction: column; gap: 10px; width: 100%; max-width: 280px; margin-top: 12px; }

button { font-family: inherit; cursor: pointer; }
.btn-primary, .btn-secondary, .btn-danger-outline { border-radius: 10px; padding: 11px 16px; font-weight: 600; font-size: 0.92rem; border: 1px solid transparent; display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 44px; transition: transform 0.12s ease, opacity 0.15s ease, box-shadow 0.15s ease; }
.btn-primary { background: linear-gradient(135deg, var(--accent-glow), var(--accent) 60%, var(--accent-strong)); color: #ffffff; box-shadow: 0 6px 18px rgba(124,92,255,0.35); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }
.btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 12px 26px rgba(124,92,255,0.5); }
.btn-secondary { background: var(--panel); color: var(--text); border-color: var(--border); box-shadow: var(--shadow-sm); }
.btn-secondary:hover { transform: translateY(-1px); border-color: var(--accent-glow); }
.btn-danger-outline { background: transparent; color: var(--danger); border-color: var(--danger); }
.btn-lg { padding: 13px 18px; font-size: 1rem; }
.btn-sm { padding: 8px 12px; font-size: 0.82rem; min-height: 36px; }
.btn-block { width: 100%; }

.back-link { background: none; border: none; color: var(--text-muted); display: inline-flex; align-items: center; gap: 4px; font-size: 0.85rem; padding: 6px 0; margin-bottom: 6px; }
.back-link:hover { color: var(--text); }

.dash-topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }

.icon-btn { background: var(--panel-alt); border: 1px solid var(--border); color: var(--text); border-radius: 8px; padding: 7px 10px; display: inline-flex; align-items: center; gap: 5px; font-size: 0.78rem; min-height: 36px; }
.icon-btn:hover { border-color: var(--accent); }
.icon-btn-danger { color: var(--danger); }
.icon-btn-danger:hover { border-color: var(--danger); }

.carrier-pick-list { display: flex; flex-direction: column; gap: 10px; }
.carrier-pick-item { background: var(--panel); border: 1px solid var(--border); border-radius: 12px; padding: 16px; display: flex; align-items: center; gap: 10px; font-size: 1rem; font-weight: 500; color: var(--text); text-align: left; min-height: 44px; box-shadow: var(--shadow-sm); transition: transform 0.12s ease, box-shadow 0.15s ease; }
.carrier-pick-item:hover { border-color: var(--accent-glow); transform: translateY(-1px); box-shadow: var(--shadow); }

.filter-bar { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
.filter-pills { display: flex; gap: 6px; flex-wrap: wrap; }
.pill { background: var(--panel); border: 1px solid var(--border); color: var(--text-muted); border-radius: 999px; padding: 7px 14px; font-size: 0.8rem; font-weight: 500; min-height: 36px; box-shadow: var(--shadow-sm); }
.pill.active { background: linear-gradient(135deg, var(--accent-glow), var(--accent)); color: #ffffff; border-color: transparent; }
.custom-range { display: flex; align-items: center; gap: 8px; font-size: 0.82rem; color: var(--text-muted); }
.custom-range input { background: var(--panel); border: 1px solid var(--border); color: var(--text); border-radius: 8px; padding: 8px; }
.search-row { display: flex; align-items: center; gap: 8px; background: var(--panel); border: 1px solid var(--border); border-radius: 10px; padding: 9px 12px; color: var(--text-muted); }
.search-row input { background: none; border: none; color: var(--text); outline: none; width: 100%; font-size: 0.9rem; }

.stat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 16px; }
.stat-card { background: var(--panel); border: 1px solid var(--border); border-radius: 12px; padding: 14px; box-shadow: var(--shadow-sm); }
.stat-icon { color: var(--accent); margin-bottom: 8px; }
.stat-value { font-family: 'JetBrains Mono', monospace; font-size: 1.15rem; font-weight: 600; }
.stat-label { color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em; margin-top: 2px; }
.stat-sub { color: var(--text-muted); font-size: 0.72rem; margin-top: 4px; }

.gauge-row { display: flex; flex-direction: column; align-items: center; gap: 18px; background: var(--panel); border: 1px solid var(--border); border-radius: 14px; padding: 18px; margin-bottom: 16px; box-shadow: var(--shadow-sm); }
.gauge-wrap { position: relative; }
.gauge-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.gauge-pct { font-family: 'JetBrains Mono', monospace; font-size: 1.5rem; font-weight: 600; }
.gauge-label { color: var(--text-muted); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.04em; }
.lane-list { width: 100%; }
.lane-list-title { font-family: 'Oswald', sans-serif; text-transform: uppercase; letter-spacing: 0.04em; font-size: 0.78rem; color: var(--text-muted); margin-bottom: 8px; }
.lane-row { display: grid; grid-template-columns: 70px 1fr 24px; align-items: center; gap: 8px; margin-bottom: 6px; font-size: 0.82rem; }
.lane-bar-track { background: var(--panel-alt); border-radius: 999px; height: 8px; overflow: hidden; }
.lane-bar-fill { background: linear-gradient(90deg, var(--accent-glow), var(--accent)); height: 100%; border-radius: 999px; }

.list-toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }

.load-list { display: flex; flex-direction: column; gap: 10px; }
.load-card { background: var(--panel); border: 1px solid var(--border); border-radius: 12px; padding: 14px; box-shadow: var(--shadow-sm); transition: box-shadow 0.15s ease; }
.load-card:hover { box-shadow: var(--shadow); }
.load-card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
.load-number { font-family: 'JetBrains Mono', monospace; font-weight: 600; font-size: 0.95rem; }
.load-route { color: var(--text-muted); font-size: 0.82rem; margin-top: 2px; }
.load-rate { font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 1.05rem; color: var(--accent); white-space: nowrap; }
.load-card-meta { display: flex; gap: 14px; flex-wrap: wrap; margin: 8px 0; }
.load-card-meta span { display: inline-flex; align-items: center; gap: 4px; font-size: 0.76rem; color: var(--text-muted); }
.load-card-badges { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
.badge-btn { background: none; border: none; padding: 0; min-height: unset; }
.badge { display: inline-flex; align-items: center; gap: 4px; padding: 5px 10px; border-radius: 999px; font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.02em; }
.badge-paid { background: rgba(52,211,153,0.16); color: var(--success); }
.badge-unpaid { background: rgba(124,92,255,0.16); color: var(--accent-glow); }
.badge-danger { background: rgba(251,113,133,0.16); color: var(--danger); }
.load-card-footer { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; border-top: 1px solid var(--border); padding-top: 10px; }
.fee-line { font-size: 0.82rem; color: var(--text-muted); }
.load-actions { display: flex; gap: 6px; flex-wrap: wrap; }
.load-notes { margin-top: 10px; padding-top: 10px; border-top: 1px dashed var(--border); font-size: 0.82rem; color: var(--text-muted); }

.empty-state { background: var(--panel); border: 1px dashed var(--border); border-radius: 12px; padding: 24px; text-align: center; color: var(--text-muted); font-size: 0.88rem; }

.modal-overlay { position: fixed; inset: 0; background: rgba(3,6,14,0.72); display: flex; align-items: center; justify-content: center; padding: 16px; z-index: 50; }
.modal-panel { background: var(--panel); border: 1px solid var(--border); border-radius: 16px; width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; box-shadow: 0 24px 60px rgba(0,0,0,0.55); }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 18px; border-bottom: 1px solid var(--border); }
.modal-header h3 { font-family: 'Oswald', sans-serif; text-transform: uppercase; letter-spacing: 0.03em; font-size: 1rem; margin: 0; }
.modal-body { padding: 18px; display: flex; flex-direction: column; gap: 14px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 14px 18px; border-top: 1px solid var(--border); }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.field { display: flex; flex-direction: column; gap: 6px; font-size: 0.8rem; color: var(--text-muted); grid-column: span 2; }
.field-half { grid-column: span 1; }
.field input, .field select, .field textarea { background: var(--panel-alt); border: 1px solid var(--border); color: var(--text); border-radius: 8px; padding: 10px; font-size: 0.9rem; font-family: inherit; outline: none; }
.field input:focus, .field select:focus, .field textarea:focus { border-color: var(--accent); }
.field textarea { resize: vertical; }

.add-carrier-row { display: flex; gap: 8px; }
.add-carrier-row input { flex: 1; background: var(--panel-alt); border: 1px solid var(--border); color: var(--text); border-radius: 8px; padding: 10px; }
.carrier-list { display: flex; flex-direction: column; gap: 8px; }
.carrier-row { display: flex; align-items: center; gap: 8px; background: var(--panel-alt); border: 1px solid var(--border); border-radius: 10px; padding: 10px 12px; }
.carrier-row input { flex: 1; background: var(--panel); border: 1px solid var(--border); color: var(--text); border-radius: 6px; padding: 6px 8px; }
.carrier-name { flex: 1; font-size: 0.88rem; }

.invoice-preview { width: 100%; border-radius: 10px; border: 1px solid var(--border); }
.pdf-placeholder { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 30px; background: var(--panel-alt); border-radius: 10px; color: var(--text-muted); }

.pin-box { background: var(--panel); border: 1px solid var(--border); border-radius: 16px; padding: 28px; display: flex; flex-direction: column; align-items: center; gap: 10px; width: 100%; max-width: 300px; box-shadow: var(--shadow); }
.pin-input { background: var(--panel-alt); border: 1px solid var(--border); color: var(--text); border-radius: 10px; padding: 12px; font-size: 1.4rem; letter-spacing: 0.4em; text-align: center; width: 100%; font-family: 'JetBrains Mono', monospace; }

.tab-row { display: flex; gap: 6px; margin-bottom: 16px; border-bottom: 1px solid var(--border); }
.tab-btn { background: none; border: none; color: var(--text-muted); padding: 10px 14px; font-weight: 600; font-size: 0.85rem; border-bottom: 2px solid transparent; min-height: 40px; }
.tab-btn.active { color: var(--accent); border-bottom-color: var(--accent); }

.dispatcher-controls { display: flex; gap: 8px; margin-bottom: 14px; flex-wrap: wrap; }
.carrier-filter { flex: 1; min-width: 140px; background: var(--panel); border: 1px solid var(--border); color: var(--text); border-radius: 10px; padding: 10px; font-size: 0.88rem; }

.carriers-panel { display: flex; flex-direction: column; gap: 14px; }
.carrier-summary-list { display: flex; flex-direction: column; gap: 10px; }
.carrier-summary-card { background: var(--panel); border: 1px solid var(--border); border-radius: 12px; padding: 14px; }
.carrier-summary-name { display: flex; align-items: center; gap: 6px; font-weight: 600; margin-bottom: 8px; }
.carrier-summary-stats { display: flex; gap: 14px; flex-wrap: wrap; font-size: 0.8rem; color: var(--text-muted); }

.settings-panel { display: flex; flex-direction: column; gap: 12px; }
.settings-card { background: var(--panel); border: 1px solid var(--border); border-radius: 12px; padding: 16px; }
.settings-card h3 { font-family: 'Oswald', sans-serif; text-transform: uppercase; letter-spacing: 0.03em; font-size: 0.92rem; margin: 0 0 8px; }
.pin-change-row { display: flex; gap: 8px; margin-top: 10px; }
.pin-change-row input { flex: 1; background: var(--panel-alt); border: 1px solid var(--border); color: var(--text); border-radius: 8px; padding: 9px; }

.toast { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: var(--panel-alt); border: 1px solid var(--border); color: var(--text); padding: 12px 18px; border-radius: 10px; font-size: 0.85rem; z-index: 100; box-shadow: 0 8px 24px rgba(0,0,0,0.4); }
.toast-error { border-color: var(--danger); color: var(--danger); }
.toast-success { border-color: var(--success); }

.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

button:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible, a:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

@media (prefers-reduced-motion: reduce) {
  * { transition: none !important; animation: none !important; }
}

@media (min-width: 700px) {
  .stat-grid { grid-template-columns: repeat(4, 1fr); }
  .gauge-row { flex-direction: row; align-items: center; justify-content: center; gap: 36px; }
  .lane-list { max-width: 340px; }
  .landing-actions { flex-direction: row; max-width: 420px; }
  .btn-block-mobile-only { width: auto; }
}
`;

/* ---------------------------------- small components ---------------------------------- */

function Toast({ toast }) {
  if (!toast) return null;
  return <div className={`toast toast-${toast.type}`}>{toast.msg}</div>;
}

function Badge({ kind, children }) {
  return <span className={`badge badge-${kind}`}>{children}</span>;
}

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="stat-card">
      <div className="stat-icon"><Icon size={18} /></div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

function GaugeRing({ percent, label, size = 140 }) {
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const safePct = Math.min(Math.max(percent, 0), 100);
  const offset = c - (safePct / 100) * c;
  const color = safePct >= 80 ? "var(--success)" : safePct >= 50 ? "var(--accent)" : "var(--danger)";
  return (
    <div className="gauge-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--border)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={color} strokeWidth={stroke} fill="none"
          strokeDasharray={c} strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="gauge-center">
        <div className="gauge-pct">{percent}%</div>
        <div className="gauge-label">{label}</div>
      </div>
    </div>
  );
}

function FilterBar({ dateFilter, setDateFilter, customStart, customEnd, setCustomStart, setCustomEnd, search, setSearch }) {
  return (
    <div className="filter-bar">
      <div className="filter-pills">
        {["week", "month", "all", "custom"].map((f) => (
          <button key={f} className={`pill ${dateFilter === f ? "active" : ""}`} onClick={() => setDateFilter(f)}>
            {f === "week" ? "This Week" : f === "month" ? "This Month" : f === "all" ? "All Time" : "Custom"}
          </button>
        ))}
      </div>
      {dateFilter === "custom" && (
        <div className="custom-range">
          <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
          <span>to</span>
          <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
        </div>
      )}
      <div className="search-row">
        <Search size={15} />
        <input placeholder="Search load #..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
    </div>
  );
}

function LoadCard({ load, carrierName, isDispatcher, onEdit, onDelete, onDuplicate, onToggleFee }) {
  const overdue = load.feeStatus === "unpaid" && daysBetween(parseISO(load.date), new Date()) > 7;
  const overdueDays = overdue ? daysBetween(parseISO(load.date), new Date()) : 0;

  return (
    <div className="load-card">
      <div className="load-card-top">
        <div>
          <div className="load-number">#{load.loadNumber}</div>
          <div className="load-route">{load.origin} → {load.destination}</div>
        </div>
        <div className="load-rate">{fmtMoney(load.rate)}</div>
      </div>
      <div className="load-card-meta">
        <span><Calendar size={13} /> {fmtDate(load.date)}</span>
        <span><Building2 size={13} /> {carrierName}</span>
        {load.broker && <span><FileText size={13} /> {load.broker}</span>}
      </div>
      <div className="load-card-badges">
        <button className="badge-btn" onClick={isDispatcher ? () => onToggleFee(load) : undefined} disabled={!isDispatcher} style={{ cursor: isDispatcher ? "pointer" : "default" }}>
          <Badge kind={load.feeStatus}>{load.feeStatus === "paid" ? "Fee Paid" : "Fee Unpaid"}</Badge>
        </button>
        {overdue && <Badge kind="danger"><AlertTriangle size={11} /> {overdueDays}d overdue</Badge>}
      </div>
      <div className="load-card-footer">
        <div className="fee-line">Dispatch fee: <strong>{fmtMoney(load.dispatchFee)}</strong></div>
        <div className="load-actions">
          {isDispatcher && (
            <>
              <button className="icon-btn" onClick={() => onDuplicate(load)}><Copy size={14} /></button>
              <button className="icon-btn" onClick={() => onEdit(load)}><Pencil size={14} /></button>
              <button className="icon-btn icon-btn-danger" onClick={() => onDelete(load)}><Trash2 size={14} /></button>
            </>
          )}
        </div>
      </div>
      {load.notes && <div className="load-notes">{load.notes}</div>}
    </div>
  );
}

function LoadFormModal({ initial, carriers, onSave, onClose, saving }) {
  const [form, setForm] = useState(() => ({
    id: initial && initial.id ? initial.id : null,
    loadNumber: (initial && initial.loadNumber) || "",
    carrierId: (initial && initial.carrierId) || (carriers[0] ? carriers[0].id : ""),
    origin: (initial && initial.origin) || "",
    destination: (initial && initial.destination) || "",
    broker: (initial && initial.broker) || "",
    rate: initial && initial.rate !== undefined ? initial.rate : "",
    date: (initial && initial.date) || todayISO(),
    dispatchFee: initial && initial.dispatchFee !== undefined ? initial.dispatchFee : "",
    feeStatus: (initial && initial.feeStatus) || "unpaid",
    notes: (initial && initial.notes) || "",
  }));
  const [feeTouched, setFeeTouched] = useState(!!(initial && initial.id));

  useEffect(() => {
    if (!feeTouched && form.rate !== "") {
      const suggested = Math.round(Number(form.rate) * 0.07 * 100) / 100;
      setForm((f) => ({ ...f, dispatchFee: suggested }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.rate]);

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const canSave = form.loadNumber.trim() && form.carrierId && form.origin.trim() && form.destination.trim() && form.rate !== "" && form.date;

  const submit = () => {
    if (!canSave) return;
    onSave({ ...form, rate: Number(form.rate), dispatchFee: Number(form.dispatchFee || 0) });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{form.id ? "Edit Load" : "Add Load"}</h3>
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <label className="field">
              <span>Load #</span>
              <input value={form.loadNumber} onChange={(e) => update("loadNumber", e.target.value)} placeholder="e.g. 37500107" />
            </label>
            <label className="field">
              <span>Carrier</span>
              <select value={form.carrierId} onChange={(e) => update("carrierId", e.target.value)}>
                {carriers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label className="field field-half">
              <span>Origin</span>
              <input value={form.origin} onChange={(e) => update("origin", e.target.value.toUpperCase())} placeholder="WA" maxLength={20} list="state-list" />
            </label>
            <label className="field field-half">
              <span>Destination</span>
              <input value={form.destination} onChange={(e) => update("destination", e.target.value.toUpperCase())} placeholder="OR" maxLength={20} list="state-list" />
            </label>
            <label className="field">
              <span>Broker</span>
              <input value={form.broker} onChange={(e) => update("broker", e.target.value)} placeholder="e.g. TQL, Coyote..." />
            </label>
            <label className="field field-half">
              <span>Rate ($)</span>
              <input type="number" min="0" step="0.01" value={form.rate} onChange={(e) => update("rate", e.target.value)} placeholder="700" />
            </label>
            <label className="field field-half">
              <span>Date</span>
              <input type="date" value={form.date} onChange={(e) => update("date", e.target.value)} />
            </label>
            <label className="field field-half">
              <span>Dispatch Fee ($)</span>
              <input type="number" min="0" step="0.01" value={form.dispatchFee} onChange={(e) => { setFeeTouched(true); update("dispatchFee", e.target.value); }} placeholder="auto 7%" />
            </label>
            <label className="field field-half">
              <span>Fee Status</span>
              <select value={form.feeStatus} onChange={(e) => update("feeStatus", e.target.value)}>
                <option value="unpaid">Unpaid</option>
                <option value="paid">Paid</option>
              </select>
            </label>
            <label className="field">
              <span>Notes (optional)</span>
              <textarea rows={2} value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Anything worth flagging..." />
            </label>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={submit} disabled={!canSave || saving}>{saving ? "Saving…" : "Save Load"}</button>
        </div>
      </div>
    </div>
  );
}

function CarrierManagerModal({ carriers, loads, onAdd, onRename, onDelete, onClose }) {
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Manage Carriers</h3>
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="add-carrier-row">
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Company name" />
            <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Login email" type="email" />
            <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Password" />
            <button className="btn-primary btn-sm" onClick={() => { onAdd(newName, newEmail, newPassword); setNewName(""); setNewEmail(""); setNewPassword(""); }}>Add</button>
          </div>
          <div className="carrier-list">
            {carriers.map((c) => {
              const count = loads.filter((l) => l.carrierId === c.id).length;
              return (
                <div className="carrier-row" key={c.id}>
                  {editingId === c.id ? (
                    <>
                      <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Name" />
                      <input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="Email" type="email" />
                      <input value={editPassword} onChange={(e) => setEditPassword(e.target.value)} placeholder="Password" />
                      <button className="icon-btn" onClick={() => { onRename(c.id, editName, editEmail, editPassword); setEditingId(null); }}><CheckCircle2 size={15} /></button>
                    </>
                  ) : (
                    <>
                      <span className="carrier-name">{c.name} <span className="muted-text">({count} loads · {c.email || "no email"})</span></span>
                      <button className="icon-btn" onClick={() => { setEditingId(c.id); setEditName(c.name); setEditEmail(c.email || ""); setEditPassword(c.password || ""); }}><Pencil size={14} /></button>
                      <button className="icon-btn icon-btn-danger" onClick={() => onDelete(c)}><Trash2 size={14} /></button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function InvoiceAdminRow({ carrier, onUpload, onView, uploading }) {
  const fileInputRef = useRef(null);
  return (
    <div className="load-card">
      <div className="load-card-top">
        <div className="load-number">{carrier.name}</div>
        <div className="load-actions">
          {carrier.hasInvoice ? (
            <button className="icon-btn" onClick={() => onView(carrier)}><Eye size={14} /> View invoice</button>
          ) : (
            <>
              <button className="icon-btn" disabled={uploading} onClick={() => fileInputRef.current && fileInputRef.current.click()}><Upload size={14} /> Upload invoice</button>
              <input
                ref={fileInputRef} type="file" accept="image/*,application/pdf" hidden
                onChange={(e) => { onUpload(carrier, e.target.files[0]); e.target.value = ""; }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function InvoiceModal({ carrier, data, onClose, onRemove }) {
  const isImage = data.mimeType && data.mimeType.startsWith("image/");
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Invoice — {carrier.name}</h3>
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          {isImage ? (
            <img src={data.dataUrl} alt={data.filename} className="invoice-preview" />
          ) : (
            <div className="pdf-placeholder">
              <FileText size={36} />
              <div>{data.filename}</div>
            </div>
          )}
          <a className="btn-secondary btn-block" href={data.dataUrl} download={data.filename} target="_blank" rel="noreferrer">Open / Download</a>
          {onRemove && <button className="btn-danger-outline btn-block" onClick={() => onRemove(carrier)}>Remove invoice</button>}
        </div>
      </div>
    </div>
  );
}

function SettingsPanel({ settings, onChangePin }) {
  const [pin, setPin] = useState("");
  return (
    <div className="settings-panel">
      <div className="settings-card">
        <h3>Dispatcher PIN</h3>
        <p className="muted-text">Locks editing on this device. It's a light deterrent, not real security — don't rely on it for highly sensitive data.</p>
        <div className="pin-change-row">
          <input type="text" inputMode="numeric" placeholder="New 4–8 digit PIN" value={pin} onChange={(e) => setPin(e.target.value)} />
          <button className="btn-primary btn-sm" onClick={() => { onChangePin(pin); setPin(""); }}>Update</button>
        </div>
      </div>
      <div className="settings-card">
        <h3>About this app</h3>
        <p className="muted-text">Load and carrier data updates live for everyone who opens this link. Invoice files are capped around 2MB — compress large PDFs before uploading.</p>
      </div>
    </div>
  );
}

/* ---------------------------------- main app ---------------------------------- */

export default function App() {
  const [screen, setScreen] = useState("landing");
  const [loading, setLoading] = useState(true);
  const [carriers, setCarriers] = useState([]);
  const [loads, setLoads] = useState([]);
  const [settings, setSettings] = useState({ pin: "1234" });
  const [selectedCarrierId, setSelectedCarrierId] = useState(null);
  const [isDispatcher, setIsDispatcher] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [carrierEmailInput, setCarrierEmailInput] = useState("");
  const [carrierPasswordInput, setCarrierPasswordInput] = useState("");
  const [carrierLoginError, setCarrierLoginError] = useState("");
  const [dispatcherTab, setDispatcherTab] = useState("loads");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [dispatcherCarrierFilter, setDispatcherCarrierFilter] = useState("all");
  const [showLoadForm, setShowLoadForm] = useState(false);
  const [editingLoad, setEditingLoad] = useState(null);
  const [showCarrierManager, setShowCarrierManager] = useState(false);
  const [invoiceModal, setInvoiceModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { init(); }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  const init = async () => {
    setLoading(true);
    const carriersRaw = await storageGet("carriers-list");
    const loadsRaw = await storageGet("loads-data");
    const settingsRaw = await storageGet("app-settings");

    let carriersArr, loadsArr, settingsObj;

    if (!carriersRaw) {
      carriersArr = SEED_CARRIERS;
      await storageSet("carriers-list", JSON.stringify(carriersArr));
    } else {
      try { carriersArr = JSON.parse(carriersRaw); } catch (e) { carriersArr = SEED_CARRIERS; }
    }

    if (!loadsRaw) {
      loadsArr = SEED_LOADS;
      await storageSet("loads-data", JSON.stringify(loadsArr));
    } else {
      try { loadsArr = JSON.parse(loadsRaw); } catch (e) { loadsArr = []; }
    }

    if (!settingsRaw) {
      settingsObj = { pin: "1234" };
      await storageSet("app-settings", JSON.stringify(settingsObj));
    } else {
      try { settingsObj = JSON.parse(settingsRaw); } catch (e) { settingsObj = { pin: "1234" }; }
    }

    setCarriers(carriersArr);
    setLoads(loadsArr);
    setSettings(settingsObj);
    setLoading(false);
  };

  const persistLoads = async (next) => {
    setLoads(next);
    const ok = await storageSet("loads-data", JSON.stringify(next));
    if (!ok) showToast("Could not save — check connection and try again.", "error");
    return ok;
  };
  const persistCarriers = async (next) => {
    setCarriers(next);
    const ok = await storageSet("carriers-list", JSON.stringify(next));
    if (!ok) showToast("Could not save — check connection and try again.", "error");
    return ok;
  };
  const persistSettings = async (next) => {
    setSettings(next);
    const ok = await storageSet("app-settings", JSON.stringify(next));
    if (!ok) showToast("Could not save settings.", "error");
    return ok;
  };

  const handleSaveLoad = async (formData) => {
    setSaving(true);
    let next;
    if (formData.id) {
      next = loads.map((l) => (l.id === formData.id ? { ...l, ...formData, updatedAt: todayISO() } : l));
    } else {
      const newLoad = { ...formData, id: uid(), createdAt: todayISO(), updatedAt: todayISO() };
      next = [newLoad, ...loads];
    }
    await persistLoads(next);
    setSaving(false);
    setShowLoadForm(false);
    setEditingLoad(null);
    showToast(formData.id ? "Load updated." : "Load added.");
  };

  const handleDeleteLoad = async (load) => {
    if (!window.confirm(`Delete load #${load.loadNumber}? This can't be undone.`)) return;
    const next = loads.filter((l) => l.id !== load.id);
    await persistLoads(next);
    showToast("Load deleted.");
  };

  const handleDuplicateLoad = (load) => {
    const rest = { ...load };
    delete rest.id; delete rest.createdAt; delete rest.updatedAt;
    setEditingLoad({ ...rest, loadNumber: "", date: todayISO() });
    setShowLoadForm(true);
  };

  const toggleFeeStatus = async (load) => {
    const next = loads.map((l) => (l.id === load.id ? { ...l, feeStatus: l.feeStatus === "paid" ? "unpaid" : "paid", updatedAt: todayISO() } : l));
    await persistLoads(next);
  };

  const handleAddCarrier = async (name, email, password) => {
    const trimmed = (name || "").trim();
    const trimmedEmail = (email || "").trim().toLowerCase();
    const trimmedPw = (password || "").trim();
    if (!trimmed) return;
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) { showToast("A valid login email is required.", "error"); return; }
    if (!trimmedPw) { showToast("A password is required for the carrier.", "error"); return; }
    if (carriers.some((c) => (c.email || "").toLowerCase() === trimmedEmail)) { showToast("That email is already in use.", "error"); return; }
    const next = [...carriers, { id: uid(), name: trimmed, email: trimmedEmail, password: trimmedPw, hasInvoice: false, createdAt: todayISO() }];
    await persistCarriers(next);
    showToast("Carrier added.");
  };
  const handleRenameCarrier = async (id, name, email, password) => {
    const trimmed = (name || "").trim();
    const trimmedEmail = (email || "").trim().toLowerCase();
    const trimmedPw = (password || "").trim();
    if (!trimmed) return;
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) { showToast("A valid login email is required.", "error"); return; }
    if (!trimmedPw) { showToast("A password is required for the carrier.", "error"); return; }
    if (carriers.some((c) => c.id !== id && (c.email || "").toLowerCase() === trimmedEmail)) { showToast("That email is already in use.", "error"); return; }
    const next = carriers.map((c) => (c.id === id ? { ...c, name: trimmed, email: trimmedEmail, password: trimmedPw } : c));
    await persistCarriers(next);
    showToast("Carrier updated.");
  };
  const handleDeleteCarrier = async (carrier) => {
    const hasLoads = loads.some((l) => l.carrierId === carrier.id);
    if (hasLoads) { showToast("Reassign or delete this carrier's loads first.", "error"); return; }
    if (!window.confirm(`Remove carrier "${carrier.name}"?`)) return;
    const next = carriers.filter((c) => c.id !== carrier.id);
    await persistCarriers(next);
    showToast("Carrier removed.");
  };

  const MAX_FILE_BYTES = 2 * 1024 * 1024;

  const handleUploadInvoice = async (carrier, file) => {
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) { showToast("File is too big — please use a file under 2MB.", "error"); return; }
    if (!/^image\/|^application\/pdf$/.test(file.type)) { showToast("Please upload an image or PDF.", "error"); return; }
    setSaving(true);
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("read failed"));
        reader.readAsDataURL(file);
      });
      const record = { filename: file.name, mimeType: file.type, dataUrl, uploadedAt: new Date().toISOString() };
      const ok = await storageSet(`invoice:${carrier.id}`, JSON.stringify(record));
      if (!ok) { showToast("Upload failed — try a smaller file.", "error"); setSaving(false); return; }
      const next = carriers.map((c) => (c.id === carrier.id ? { ...c, hasInvoice: true } : c));
      await persistCarriers(next);
      showToast("Invoice uploaded.");
    } catch (e) {
      showToast("Upload failed.", "error");
    }
    setSaving(false);
  };

  const handleViewInvoice = async (carrier) => {
    const raw = await storageGet(`invoice:${carrier.id}`);
    if (!raw) { showToast("Invoice not found.", "error"); return; }
    try {
      const data = JSON.parse(raw);
      setInvoiceModal({ carrier, data });
    } catch (e) {
      showToast("Could not open invoice.", "error");
    }
  };

  const handleRemoveInvoice = async (carrier) => {
    if (!window.confirm("Remove this invoice?")) return;
    await storageDelete(`invoice:${carrier.id}`);
    const next = carriers.map((c) => (c.id === carrier.id ? { ...c, hasInvoice: false } : c));
    await persistCarriers(next);
    showToast("Invoice removed.");
    setInvoiceModal(null);
  };

  const handlePinSubmit = () => {
    if (pinInput === (settings.pin || "1234")) {
      setIsDispatcher(true);
      setScreen("dispatcherDash");
      setPinInput("");
      setPinError("");
    } else {
      setPinError("Incorrect PIN.");
    }
  };
  const handleChangePin = async (newPin) => {
    if (!/^\d{4,8}$/.test(newPin)) { showToast("PIN should be 4–8 digits.", "error"); return; }
    await persistSettings({ ...settings, pin: newPin });
    showToast("PIN updated.");
  };
  const handleCarrierLoginSubmit = () => {
    const email = carrierEmailInput.trim().toLowerCase();
    if (!email || !carrierPasswordInput) { setCarrierLoginError("Enter your email and password."); return; }
    const carrier = carriers.find((c) => (c.email || "").toLowerCase() === email);
    if (!carrier || carrierPasswordInput !== (carrier.password || "")) {
      setCarrierLoginError("Incorrect email or password.");
      return;
    }
    setSelectedCarrierId(carrier.id);
    setDateFilter("all");
    setSearch("");
    setCarrierEmailInput("");
    setCarrierPasswordInput("");
    setCarrierLoginError("");
    setScreen("carrierDash");
  };
  const handleLogoutDispatcher = () => {
    setIsDispatcher(false);
    setScreen("landing");
    setDispatcherTab("loads");
  };

  const filterByDate = (list) => {
    if (dateFilter === "all") return list;
    const now = new Date();
    if (dateFilter === "week") {
      const { start, end } = getWeekRange(now);
      return list.filter((l) => { const d = parseISO(l.date); return d >= start && d <= end; });
    }
    if (dateFilter === "month") {
      const { start, end } = getMonthRange(now);
      return list.filter((l) => { const d = parseISO(l.date); return d >= start && d <= end; });
    }
    if (dateFilter === "custom" && customStart && customEnd) {
      const start = parseISO(customStart);
      const end = parseISO(customEnd);
      end.setHours(23, 59, 59, 999);
      return list.filter((l) => { const d = parseISO(l.date); return d >= start && d <= end; });
    }
    return list;
  };

  const carrierLoads = useMemo(() => {
    if (!selectedCarrierId) return [];
    let list = loads.filter((l) => l.carrierId === selectedCarrierId);
    list = filterByDate(list);
    if (search.trim()) list = list.filter((l) => l.loadNumber.toLowerCase().includes(search.trim().toLowerCase()));
    return list.slice().sort((a, b) => b.date.localeCompare(a.date));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loads, selectedCarrierId, dateFilter, customStart, customEnd, search]);

  const dispatcherLoads = useMemo(() => {
    let list = dispatcherCarrierFilter === "all" ? loads : loads.filter((l) => l.carrierId === dispatcherCarrierFilter);
    list = filterByDate(list);
    if (search.trim()) list = list.filter((l) => l.loadNumber.toLowerCase().includes(search.trim().toLowerCase()));
    return list.slice().sort((a, b) => b.date.localeCompare(a.date));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loads, dispatcherCarrierFilter, dateFilter, customStart, customEnd, search]);

  const computeStats = (list) => {
    const totalRevenue = list.reduce((s, l) => s + Number(l.rate || 0), 0);
    const totalFees = list.reduce((s, l) => s + Number(l.dispatchFee || 0), 0);
    const paidFees = list.filter((l) => l.feeStatus === "paid").reduce((s, l) => s + Number(l.dispatchFee || 0), 0);
    const unpaidFees = totalFees - paidFees;
    const collectPct = totalFees > 0 ? Math.round((paidFees / totalFees) * 100) : 100;
    return { count: list.length, totalRevenue, totalFees, paidFees, unpaidFees, collectPct };
  };

  const laneBreakdown = (list) => {
    const map = {};
    list.forEach((l) => { const key = `${l.origin} → ${l.destination}`; map[key] = (map[key] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6);
  };

  const exportCSV = (list) => {
    const carrierName = (id) => { const c = carriers.find((c) => c.id === id); return c ? c.name : "Unassigned"; };
    const header = ["Load #", "Carrier", "Broker", "Origin", "Destination", "Rate", "Date", "Dispatch Fee", "Fee Status", "Notes"];
    const rows = list.map((l) => [l.loadNumber, carrierName(l.carrierId), l.broker || "", l.origin, l.destination, l.rate, l.date, l.dispatchFee, l.feeStatus, (l.notes || "").replace(/,/g, ";")]);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `loads-export-${todayISO()}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="app-shell center-screen">
        <style>{CSS}</style>
        <Loader2 className="spin" size={26} />
        <div className="muted-text">Loading loads…</div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <style>{CSS}</style>
      <datalist id="state-list">{US_STATES.map((s) => <option key={s} value={s} />)}</datalist>
      <Toast toast={toast} />

      {screen === "landing" && (
        <div className="landing center-screen">
          <div className="landing-badge"><Truck size={28} /></div>
          <h1 className="landing-title">TekLink Sol</h1>
          <p className="landing-sub">Load &amp; dispatch fee tracker</p>
          <div className="landing-actions">
            <button className="btn-primary btn-lg" onClick={() => { setCarrierEmailInput(""); setCarrierPasswordInput(""); setCarrierLoginError(""); setScreen("carrierLogin"); }}><Users size={18} /> I'm a Carrier</button>
            <button className="btn-secondary btn-lg" onClick={() => setScreen("dispatcherPin")}><Lock size={18} /> Dispatcher Login</button>
          </div>
        </div>
      )}

      {screen === "carrierLogin" && (
        <div className="screen-pad center-screen">
          <button className="back-link" onClick={() => setScreen("landing")}><ChevronLeft size={16} /> Back</button>
          <div className="pin-box">
            <Lock size={22} />
            <h2 className="section-title">Carrier Login</h2>
            <input
              type="email" className="pin-input" value={carrierEmailInput}
              onChange={(e) => { setCarrierEmailInput(e.target.value); setCarrierLoginError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleCarrierLoginSubmit()}
              placeholder="you@company.com" autoFocus
            />
            <input
              type="password" className="pin-input" value={carrierPasswordInput}
              onChange={(e) => { setCarrierPasswordInput(e.target.value); setCarrierLoginError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleCarrierLoginSubmit()}
              placeholder="Password"
            />
            {carrierLoginError && <div className="error-text">{carrierLoginError}</div>}
            <button className="btn-primary btn-lg btn-block" onClick={handleCarrierLoginSubmit}>Log in</button>
          </div>
        </div>
      )}

      {screen === "carrierDash" && selectedCarrierId && (() => {
        const carrier = carriers.find((c) => c.id === selectedCarrierId);
        const stats = computeStats(carrierLoads);
        const lanes = laneBreakdown(carrierLoads);
        return (
          <div className="screen-pad">
            <button className="back-link" onClick={() => { setSelectedCarrierId(null); setScreen("carrierLogin"); }}><ChevronLeft size={16} /> Log out</button>
            <div className="dash-topbar">
              <h2 className="section-title"><Building2 size={18} /> {carrier ? carrier.name : ""}</h2>
              {carrier && carrier.hasInvoice ? (
                <button className="icon-btn" onClick={() => handleViewInvoice(carrier)}><Eye size={14} /> Invoice</button>
              ) : (
                <span className="muted-text">No invoice on file</span>
              )}
            </div>
            <FilterBar dateFilter={dateFilter} setDateFilter={setDateFilter} customStart={customStart} customEnd={customEnd} setCustomStart={setCustomStart} setCustomEnd={setCustomEnd} search={search} setSearch={setSearch} />
            <div className="stat-grid">
              <StatCard icon={Package} label="Loads" value={stats.count} />
              <StatCard icon={DollarSign} label="Revenue" value={fmtMoney(stats.totalRevenue)} />
              <StatCard icon={TrendingUp} label="Dispatch Fees" value={fmtMoney(stats.totalFees)} sub={`${fmtMoney(stats.unpaidFees)} unpaid`} />
            </div>
            <div className="gauge-row">
              <GaugeRing percent={stats.collectPct} label="Fees Paid" />
              <div className="lane-list">
                <div className="lane-list-title">Lanes</div>
                {lanes.length === 0 && <div className="muted-text">No loads in this range.</div>}
                {lanes.map(([lane, count]) => (
                  <div className="lane-row" key={lane}>
                    <span>{lane}</span>
                    <div className="lane-bar-track"><div className="lane-bar-fill" style={{ width: `${(count / Math.max(stats.count, 1)) * 100}%` }} /></div>
                    <span className="muted-text">{count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="load-list">
              {carrierLoads.length === 0 ? (
                <div className="empty-state">No loads match this filter.</div>
              ) : carrierLoads.map((l) => (
                <LoadCard key={l.id} load={l} carrierName={carrier ? carrier.name : ""} isDispatcher={false} />
              ))}
            </div>
          </div>
        );
      })()}

      {screen === "dispatcherPin" && (
        <div className="screen-pad center-screen">
          <button className="back-link" onClick={() => setScreen("landing")}><ChevronLeft size={16} /> Back</button>
          <div className="pin-box">
            <Lock size={22} />
            <h2 className="section-title">Dispatcher PIN</h2>
            <input
              type="password" inputMode="numeric" className="pin-input" value={pinInput}
              onChange={(e) => { setPinInput(e.target.value); setPinError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handlePinSubmit()}
              placeholder="••••" autoFocus
            />
            {pinError && <div className="error-text">{pinError}</div>}
            <button className="btn-primary btn-lg btn-block" onClick={handlePinSubmit}>Unlock</button>
          </div>
        </div>
      )}

      {screen === "dispatcherDash" && isDispatcher && (() => {
        const stats = computeStats(dispatcherLoads);
        const lanes = laneBreakdown(dispatcherLoads);
        return (
          <div className="screen-pad">
            <div className="dash-topbar">
              <h2 className="section-title"><Gauge size={20} /> Dispatcher Dashboard</h2>
              <button className="icon-btn" onClick={handleLogoutDispatcher}><LogOut size={15} /></button>
            </div>
            <div className="tab-row">
              <button className={`tab-btn ${dispatcherTab === "loads" ? "active" : ""}`} onClick={() => setDispatcherTab("loads")}>Loads</button>
              <button className={`tab-btn ${dispatcherTab === "invoices" ? "active" : ""}`} onClick={() => setDispatcherTab("invoices")}>Pending Invoices</button>
              <button className={`tab-btn ${dispatcherTab === "carriers" ? "active" : ""}`} onClick={() => setDispatcherTab("carriers")}>Carriers</button>
              <button className={`tab-btn ${dispatcherTab === "settings" ? "active" : ""}`} onClick={() => setDispatcherTab("settings")}>Settings</button>
            </div>

            {dispatcherTab === "loads" && (
              <>
                <div className="dispatcher-controls">
                  <select className="carrier-filter" value={dispatcherCarrierFilter} onChange={(e) => setDispatcherCarrierFilter(e.target.value)}>
                    <option value="all">All Carriers</option>
                    {carriers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <button className="btn-primary" onClick={() => { setEditingLoad(null); setShowLoadForm(true); }}><Plus size={16} /> Add Load</button>
                </div>
                <FilterBar dateFilter={dateFilter} setDateFilter={setDateFilter} customStart={customStart} customEnd={customEnd} setCustomStart={setCustomStart} setCustomEnd={setCustomEnd} search={search} setSearch={setSearch} />
                <div className="stat-grid">
                  <StatCard icon={Package} label="Loads" value={stats.count} />
                  <StatCard icon={DollarSign} label="Revenue" value={fmtMoney(stats.totalRevenue)} />
                  <StatCard icon={TrendingUp} label="Fees Earned" value={fmtMoney(stats.totalFees)} sub={`${fmtMoney(stats.paidFees)} collected`} />
                  <StatCard icon={AlertTriangle} label="Unpaid Fees" value={fmtMoney(stats.unpaidFees)} />
                </div>
                <div className="gauge-row">
                  <GaugeRing percent={stats.collectPct} label="Fees Collected" />
                  <div className="lane-list">
                    <div className="lane-list-title">Lanes</div>
                    {lanes.length === 0 && <div className="muted-text">No loads in this range.</div>}
                    {lanes.map(([lane, count]) => (
                      <div className="lane-row" key={lane}>
                        <span>{lane}</span>
                        <div className="lane-bar-track"><div className="lane-bar-fill" style={{ width: `${(count / Math.max(stats.count, 1)) * 100}%` }} /></div>
                        <span className="muted-text">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="list-toolbar">
                  <span className="muted-text">{dispatcherLoads.length} load{dispatcherLoads.length !== 1 ? "s" : ""}</span>
                  <button className="icon-btn" onClick={() => exportCSV(dispatcherLoads)}><Download size={14} /> Export CSV</button>
                </div>
                <div className="load-list">
                  {dispatcherLoads.length === 0 ? (
                    <div className="empty-state">No loads yet — add your first one.</div>
                  ) : dispatcherLoads.map((l) => (
                    <LoadCard
                      key={l.id} load={l}
                      carrierName={(carriers.find((c) => c.id === l.carrierId) || {}).name || "Unassigned"}
                      isDispatcher={true}
                      onEdit={(ld) => { setEditingLoad(ld); setShowLoadForm(true); }}
                      onDelete={handleDeleteLoad}
                      onDuplicate={handleDuplicateLoad}
                      onToggleFee={toggleFeeStatus}
                    />
                  ))}
                </div>
              </>
            )}

            {dispatcherTab === "invoices" && (
              <div className="load-list">
                {carriers.length === 0 ? (
                  <div className="empty-state">No carriers yet.</div>
                ) : carriers.map((c) => (
                  <InvoiceAdminRow key={c.id} carrier={c} onUpload={handleUploadInvoice} onView={handleViewInvoice} uploading={saving} />
                ))}
              </div>
            )}

            {dispatcherTab === "carriers" && (
              <div className="carriers-panel">
                <button className="btn-primary" onClick={() => setShowCarrierManager(true)}><Users size={16} /> Manage Carriers</button>
                <div className="carrier-summary-list">
                  {carriers.map((c) => {
                    const cs = computeStats(loads.filter((l) => l.carrierId === c.id));
                    return (
                      <div className="carrier-summary-card" key={c.id}>
                        <div className="carrier-summary-name"><Building2 size={16} /> {c.name}</div>
                        <div className="carrier-summary-stats">
                          <span>{cs.count} loads</span>
                          <span>{fmtMoney(cs.totalRevenue)} revenue</span>
                          <span>{fmtMoney(cs.unpaidFees)} unpaid fees</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {dispatcherTab === "settings" && (
              <SettingsPanel settings={settings} onChangePin={handleChangePin} />
            )}
          </div>
        );
      })()}

      {showLoadForm && (
        <LoadFormModal
          initial={editingLoad}
          carriers={carriers}
          saving={saving}
          onSave={handleSaveLoad}
          onClose={() => { setShowLoadForm(false); setEditingLoad(null); }}
        />
      )}

      {showCarrierManager && (
        <CarrierManagerModal
          carriers={carriers}
          loads={loads}
          onAdd={handleAddCarrier}
          onRename={handleRenameCarrier}
          onDelete={handleDeleteCarrier}
          onClose={() => setShowCarrierManager(false)}
        />
      )}

      {invoiceModal && (
        <InvoiceModal
          carrier={invoiceModal.carrier}
          data={invoiceModal.data}
          onClose={() => setInvoiceModal(null)}
          onRemove={isDispatcher ? handleRemoveInvoice : null}
        />
      )}
    </div>
  );
}
