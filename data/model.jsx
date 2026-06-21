// model.jsx — mock data, heat logic, date + duration helpers
// Fixed "now" so countdowns are deterministic: Fri 5 Jun 2026, 2:23pm
const NOW = new Date(2026, 5, 5, 14, 23);
const NOW_MIN = NOW.getHours() * 60 + NOW.getMinutes();
const TODAY = new Date(2026, 5, 5);
const DAY_MS = 86400000;
const DAILY_CAP = 240;        // default minutes of focus per day

// ---------- date helpers ----------
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const sameDay = (a, b) => a && b && a.getFullYear() === b.getFullYear()
  && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const addDays = (d, n) => { const nd = new Date(d); nd.setDate(nd.getDate() + n); return startOfDay(nd); };
const daysBetween = (a, b) => Math.round((startOfDay(b) - startOfDay(a)) / DAY_MS);
function dayKey(d) { return d ? `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}` : "anytime"; }

// 6×7 grid for a month, Monday-first; cells outside the month are flagged
function monthGrid(year, month /* 0-indexed */) {
  const first = new Date(year, month, 1);
  // 0=Sun..6=Sat → make Monday=0
  const offset = (first.getDay() + 6) % 7;
  const start = addDays(first, -offset);
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const d = addDays(start, i);
    cells.push({ date: d, inMonth: d.getMonth() === month });
  }
  return cells;
}

// earthy category accents
const CATS = {
  work:   { name: "Work",   color: "oklch(0.55 0.10 250)" },
  health: { name: "Health", color: "oklch(0.60 0.11 150)" },
  home:   { name: "Home",   color: "oklch(0.58 0.09 70)"  },
  learn:  { name: "Learn",  color: "oklch(0.55 0.12 300)" },
  money:  { name: "Money",  color: "oklch(0.58 0.11 130)" },
  errand: { name: "Errand", color: "oklch(0.60 0.10 40)"  },
};
const HEAT_NAMES = ["CHILL", "EASY", "SOON", "URGENT", "NOW!"];

function fmtTime(min) {
  let h = Math.floor(min / 60), m = min % 60;
  const ap = h >= 12 ? "pm" : "am";
  h = h % 12; if (h === 0) h = 12;
  return `${h}:${String(m).padStart(2, "0")}${ap}`;
}
function fmtDur(m) {
  if (m == null) return "no estimate";
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h${m % 60 ? " " + (m % 60) + "m" : ""}`;
}

// planLabel: relative for near dates, absolute for far
function planLabel(d) {
  if (!d) return "Anytime";
  const diff = daysBetween(TODAY, d);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff > 0 && diff < 7) return d.toLocaleDateString("en-US", { weekday: "short" });
  if (diff < 0) return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " · past";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// heat 0..4
function computeHeat(t) {
  if (t.done) return 0;
  if (t.type === "daily") {
    if (t.by != null && NOW_MIN > t.by) return 4;
    if (NOW_MIN < 720) return 1;
    if (NOW_MIN < 1020) return 2;
    if (NOW_MIN < 1200) return 3;
    return 4;
  }
  if (!t.deadline) return 0;
  const hrs = (t.deadline.getTime() - NOW.getTime()) / 3600000;
  if (hrs <= 6) return 4;
  if (hrs <= 24) return 3;
  if (hrs <= 72) return 2;
  if (hrs <= 168) return 1;
  return 0;
}

function countdown(t) {
  if (t.type === "daily") {
    if (t.done) return { label: "done today", over: false };
    if (t.by == null) return { label: "anytime today", over: false };
    const dd = t.by - NOW_MIN;
    if (dd <= 0) return { label: `${fmtTime(t.by)} · missed`, over: true };
    const h = Math.floor(dd / 60), m = dd % 60;
    return { label: h > 0 ? `${h}h ${m}m left` : `${m}m left`, over: false };
  }
  if (!t.deadline) return { label: "no deadline", over: false };
  const ms = t.deadline.getTime() - NOW.getTime();
  const over = ms <= 0;
  const a = Math.abs(ms);
  const days = Math.floor(a / DAY_MS);
  const hrs = Math.floor((a % DAY_MS) / 3600000);
  const mins = Math.floor((a % 3600000) / 60000);
  let label;
  if (t.allDay && days >= 1) label = `${days}d`;
  else if (days >= 1) label = `${days}d ${hrs}h`;
  else if (hrs >= 1) label = `${hrs}h ${String(mins).padStart(2, "0")}m`;
  else label = `${mins}m`;
  return { label: over ? `${label} over` : label, over };
}

function dueBucket(t) {
  if (!t.deadline) return "Someday";
  const ms = t.deadline.getTime() - NOW.getTime();
  if (ms <= 0) return "Overdue";
  const dd = daysBetween(TODAY, startOfDay(t.deadline));
  if (dd === 0) return "Today";
  if (dd === 1) return "Tomorrow";
  if (dd <= 7) return "This week";
  if (dd <= 31) return "This month";
  return "Later";
}

// duration-based load for any date
function dayLoadMins(tasks, date) {
  let mins = 0;
  tasks.forEach(t => {
    if (t.done || t.dur == null) return;
    if (t.type === "once" && t.planDate && sameDay(t.planDate, date)) mins += t.dur;
    else if (t.type === "daily" && sameDay(date, TODAY)) mins += t.dur;
  });
  return mins;
}

const d = (mo, day, h, m) => new Date(2026, mo, day, h, m || 0);
const pd = (mo, day) => new Date(2026, mo, day);

let _id = 0; const uid = () => "t" + (++_id);
const SEED = [
  // dailies (no fixed slot; optional target time `by`)
  { id: uid(), title: "Take meds", type: "daily", cat: "health", by: 540,  dur: 5,  done: false },
  { id: uid(), title: "Morning pages", type: "daily", cat: "learn", by: 600, dur: 15, done: true },
  { id: uid(), title: "Inbox to zero", type: "daily", cat: "work",  by: 1080, dur: 45, done: false },
  { id: uid(), title: "Walk the dog", type: "daily", cat: "home",  by: 1200, dur: 30, done: false },
  { id: uid(), title: "Stretch · 10 min", type: "daily", cat: "health", dur: 10, done: false },
  { id: uid(), title: "Read 20 pages", type: "daily", cat: "learn", dur: 25, done: false },
  // one-time
  { id: uid(), title: "Send invoice #204", type: "once", cat: "money", deadline: d(5, 5, 17, 0), dur: 30, planDate: pd(5, 5), done: false, notes: "Attach the May timesheet + the revised rate card before sending to Atlas." },
  { id: uid(), title: "Submit tax documents", type: "once", cat: "money", deadline: d(5, 4, 23, 59), allDay: true, dur: 60, planDate: pd(5, 5), done: false, notes: "Upload the signed forms to the portal." },
  { id: uid(), title: "Design review prep", type: "once", cat: "work",  deadline: d(5, 6, 10, 0), dur: 60, planDate: pd(5, 5), done: false, notes: "Export the 3 flows + write the 5-line summary." },
  { id: uid(), title: "Confirm dentist appt", type: "once", cat: "health", deadline: d(5, 8, 12, 0), dur: 10, planDate: pd(5, 6), done: false },
  { id: uid(), title: "Book flights for July", type: "once", cat: "errand", deadline: d(5, 11, 23, 59), allDay: true, dur: 30, planDate: pd(5, 10), done: false },
  { id: uid(), title: "Birthday gift · Mara", type: "once", cat: "errand", deadline: d(5, 14, 23, 59), allDay: true, dur: 45, planDate: pd(5, 13), done: false },
  { id: uid(), title: "Renew passport", type: "once", cat: "home", deadline: d(6, 2, 23, 59), allDay: true, dur: null, planDate: null, done: false },
  { id: uid(), title: "Brainstorm side project", type: "once", cat: "learn", dur: null, planDate: null, done: false },
  { id: uid(), title: "Coffee with Sam", type: "once", cat: "home", deadline: d(5, 12, 14, 0), dur: 60, planDate: pd(5, 12), done: false },
  { id: uid(), title: "Annual review notes", type: "once", cat: "work", deadline: d(5, 19, 17, 0), allDay: true, dur: 90, planDate: pd(5, 18), done: false },
];

Object.assign(window, {
  NOW, NOW_MIN, TODAY, DAILY_CAP, CATS, HEAT_NAMES,
  startOfDay, sameDay, addDays, daysBetween, dayKey, monthGrid,
  fmtTime, fmtDur, planLabel, computeHeat, countdown, dueBucket, dayLoadMins, SEED, uid,
});
