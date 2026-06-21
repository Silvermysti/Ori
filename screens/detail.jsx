import React from "react";
// detail.jsx — full-screen task detail / editor + shared form controls
const { useState: useStateDet } = React;

function Stepper({ value, onChange, step = 5, min = 0, max = 600, fmt }) {
  const btn = (label, d) => (
    <button onClick={() => onChange(Math.max(min, Math.min(max, value + d)))}
      style={{ width: 38, height: 38, borderRadius: 9, border: "2px solid var(--line-2)", background: "var(--surface)",
        boxShadow: "0 3px 0 var(--shadow)", cursor: "pointer", fontFamily: "var(--font-pixel)", fontSize: 18,
        color: "var(--ink)", display: "grid", placeItems: "center" }}>{label}</button>
  );
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      {btn("−", -step)}
      <div className="px" style={{ fontSize: 20, minWidth: 70, textAlign: "center", color: "var(--ink)" }}>
        {fmt ? fmt(value) : value}</div>
      {btn("+", step)}
    </div>
  );
}

function CatPicker({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {Object.entries(window.CATS).map(([key, c]) => {
        const on = value === key;
        return (
          <button key={key} onClick={() => onChange(key)}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 11px", borderRadius: 9,
              border: `2px solid ${on ? c.color : "var(--line)"}`, cursor: "pointer",
              background: on ? "var(--surface)" : "transparent", boxShadow: on ? "0 3px 0 var(--shadow)" : "none",
              fontSize: 13, fontWeight: 650, color: on ? "var(--ink)" : "var(--ink-3)" }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, background: c.color }} />{c.name}
          </button>
        );
      })}
    </div>
  );
}

function FieldRow({ label, children }) {
  return (
    <div style={{ display: "grid", gap: 9 }}>
      <span className="eyebrow">{label}</span>
      {children}
    </div>
  );
}

const QUICK_PLAN = [
  { label: "Anytime", get: () => null },
  { label: "Today", get: () => window.TODAY },
  { label: "Tomorrow", get: () => window.addDays(window.TODAY, 1) },
  { label: "Next week", get: () => window.addDays(window.TODAY, 7) },
];

function SwitchRow({ label, sub, on, onChange }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1px 0" }}>
      <div>
        <div style={{ fontSize: 13.5, color: "var(--ink)", fontWeight: 600 }}>{label}</div>
        {sub && <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{sub}</div>}
      </div>
      <button onClick={() => onChange(!on)} aria-label={label}
        style={{ width: 50, height: 28, borderRadius: 8, border: "2px solid var(--line-2)", cursor: "pointer",
          background: on ? "var(--accent)" : "var(--sunken)", position: "relative", transition: "background .15s", padding: 0, flexShrink: 0 }}>
        <span style={{ position: "absolute", top: 2, left: on ? 24 : 2, width: 20, height: 20, borderRadius: 5,
          background: "var(--surface)", boxShadow: "0 2px 0 var(--shadow)", transition: "left .15s" }} />
      </button>
    </div>
  );
}

function HeatPreview({ task }) {
  const k = window.computeHeat(task);
  const why = task.type === "daily"
    ? "Resets every midnight. Heats up through the day — and turns NOW! if you blow past its time."
    : !task.deadline
      ? "No deadline, so it stays chill until you give it one."
      : "Stays cool until about a day before the deadline, then climbs to URGENT.";
  return (
    <div className="px-inset" style={{ padding: 14, display: "flex", gap: 13, alignItems: "center",
      borderColor: `var(--heat-${k})`, background: `var(--heat-${k}-bg)` }}>
      <div style={{ display: "grid", placeItems: "center", gap: 6 }}>
        <window.PixelIcon name="flame" size={26} color={`var(--heat-${k})`} className={k === 4 ? "is-ember" : ""} />
        <window.Meter level={k} h={5} />
      </div>
      <div style={{ flex: 1 }}>
        <div className="px" style={{ fontSize: 16, color: `var(--heat-${k})` }}>{window.HEAT_NAMES[k]}</div>
        <div style={{ fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.4, marginTop: 3 }}>{why}</div>
      </div>
    </div>
  );
}

function TaskDetail({ task, onClose, onSave, onDelete, onToggle }) {
  const [t, setT] = useStateDet({ ...task });
  const set = (patch) => setT(prev => ({ ...prev, ...patch }));
  const dlMin = t.deadline ? t.deadline.getHours() * 60 + t.deadline.getMinutes() : 1020;

  const shiftDay = (n) => {
    const nd = new Date(t.deadline || window.NOW);
    nd.setDate(nd.getDate() + n);
    set({ deadline: nd });
  };
  const setDlTime = (min) => {
    const nd = new Date(t.deadline || window.NOW);
    nd.setHours(Math.floor(min / 60), min % 60, 0, 0);
    set({ deadline: nd });
  };

  return (
    <div className="ori-scroll" style={{ height: "100%", padding: "58px 16px 40px", background: "var(--paper)" }}>
      {/* top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <button onClick={onClose} className="px-btn ghost" style={{ padding: "9px 12px" }}>
          <window.PixelIcon name="chevL" size={13} color="var(--ink)" /> Back</button>
        <button onClick={() => { onDelete(t.id); onClose(); }}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 8 }}>
          <window.PixelIcon name="trash" size={20} color="var(--ink-3)" /></button>
      </div>

      {/* title */}
      <input value={t.title} onChange={e => set({ title: e.target.value })}
        style={{ width: "100%", border: "none", background: "transparent", outline: "none",
          fontFamily: "var(--font-body)", fontSize: 27, fontWeight: 800, color: "var(--ink)", marginBottom: 6 }} />

      <div style={{ marginBottom: 18 }}>
        <window.PxSegment value={t.type} onChange={v => set({ type: v })} options={[
          { value: "daily", label: "DAILY", icon: "repeat" },
          { value: "once", label: "ONCE", icon: "target" },
        ]} />
      </div>

      <div style={{ display: "grid", gap: 20 }}>
        <HeatPreview task={t} />

        {t.type === "once" ? (
          <FieldRow label="Deadline">
            <div className="px-card flat" style={{ padding: 13, display: "grid", gap: 12 }}>
              <SwitchRow label="Has a deadline" on={!!t.deadline}
                onChange={v => set({ deadline: v ? new Date(2026, 5, 5, 17, 0) : null, allDay: false })} />
              {t.deadline && (
                <React.Fragment>
                  <div style={{ height: 2, background: "var(--line)" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: "var(--ink-2)" }}>Day</span>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <button onClick={() => shiftDay(-1)} className="px-btn ghost" style={{ padding: "6px 11px", fontSize: 16 }}>−</button>
                      <span className="px" style={{ fontSize: 15, minWidth: 92, textAlign: "center" }}>
                        {t.deadline.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
                      <button onClick={() => shiftDay(1)} className="px-btn ghost" style={{ padding: "6px 11px", fontSize: 16 }}>+</button>
                    </div>
                  </div>
                  <div style={{ height: 2, background: "var(--line)" }} />
                  <SwitchRow label="All-day" sub="no fixed time" on={!!t.allDay}
                    onChange={v => { set({ allDay: v }); if (v) setDlTime(1439); }} />
                  {!t.allDay && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 13, color: "var(--ink-2)" }}>Time</span>
                      <Stepper value={dlMin} onChange={setDlTime} step={30} min={0} max={1410} fmt={window.fmtTime} />
                    </div>
                  )}
                </React.Fragment>
              )}
            </div>
          </FieldRow>
        ) : (
          <FieldRow label="Target time">
            <div className="px-card flat" style={{ padding: 13, display: "grid", gap: 12 }}>
              <SwitchRow label="Aim to finish by a time" sub="otherwise it's anytime today" on={t.by != null}
                onChange={v => set({ by: v ? 1020 : null })} />
              {t.by != null && (
                <React.Fragment>
                  <div style={{ height: 2, background: "var(--line)" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: "var(--ink-2)" }}>By</span>
                    <Stepper value={t.by} onChange={v => set({ by: v })} step={30} min={0} max={1410} fmt={window.fmtTime} />
                  </div>
                </React.Fragment>
              )}
            </div>
          </FieldRow>
        )}

        <FieldRow label="Estimated time">
          <div className="px-card flat" style={{ padding: 13, display: "grid", gap: 12 }}>
            <SwitchRow label="Add a time estimate" sub="powers your daily load" on={t.dur != null}
              onChange={v => set({ dur: v ? 30 : null })} />
            {t.dur != null && (
              <React.Fragment>
                <div style={{ height: 2, background: "var(--line)" }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "var(--ink-2)" }}>Duration</span>
                  <Stepper value={t.dur} onChange={v => set({ dur: v })} step={5} min={5} max={240}
                    fmt={m => m >= 60 ? `${Math.floor(m / 60)}h ${m % 60 ? m % 60 + "m" : ""}` : m + "m"} />
                </div>
              </React.Fragment>
            )}
          </div>
        </FieldRow>

        {t.type === "once" && (
          <FieldRow label="Plan for">
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 8 }}>
              {QUICK_PLAN.map(q => {
                const target = q.get();
                const on = (target == null && t.planDate == null)
                  || (target != null && t.planDate != null && window.sameDay(t.planDate, target));
                return (
                  <button key={q.label} onClick={() => set({ planDate: target })}
                    style={{ padding: "7px 12px", borderRadius: 9, cursor: "pointer", fontSize: 12.5, fontWeight: 650,
                      border: `2px solid ${on ? "var(--accent)" : "var(--line)"}`, background: on ? "var(--surface)" : "transparent",
                      color: on ? "var(--accent)" : "var(--ink-3)", boxShadow: on ? "0 3px 0 var(--shadow)" : "none" }}>{q.label}</button>
                );
              })}
            </div>
            <div className="px-card flat" style={{ padding: "9px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "var(--ink-2)" }}>Pick a date</span>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <button onClick={() => set({ planDate: window.addDays(t.planDate || window.TODAY, -1) })}
                  className="px-btn ghost" style={{ padding: "6px 11px", fontSize: 16 }}>−</button>
                <span className="px" style={{ fontSize: 14, minWidth: 92, textAlign: "center" }}>
                  {t.planDate ? t.planDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : "—"}</span>
                <button onClick={() => set({ planDate: window.addDays(t.planDate || window.TODAY, 1) })}
                  className="px-btn ghost" style={{ padding: "6px 11px", fontSize: 16 }}>+</button>
              </div>
            </div>
          </FieldRow>
        )}

        <FieldRow label="Category"><CatPicker value={t.cat} onChange={v => set({ cat: v })} /></FieldRow>

        <FieldRow label="Notes">
          <textarea value={t.notes || ""} onChange={e => set({ notes: e.target.value })} placeholder="Add a note…"
            style={{ width: "100%", minHeight: 70, resize: "vertical", borderRadius: 11, padding: 12,
              border: "2px solid var(--line)", background: "var(--sunken)", color: "var(--ink)",
              fontFamily: "var(--font-body)", fontSize: 14, outline: "none" }} />
        </FieldRow>

        <div style={{ display: "flex", gap: 12 }}>
          <button className="px-btn ghost" style={{ flex: 1 }} onClick={() => { onToggle(t.id); onClose(); }}>
            <window.PixelIcon name="check" size={14} color="var(--ink)" /> {t.done ? "Reopen" : "Done"}</button>
          <button className="px-btn" style={{ flex: 1.4 }} onClick={() => { onSave(t); onClose(); }}>Save</button>
        </div>
      </div>
    </div>
  );
}
Object.assign(window, { TaskDetail, Stepper, CatPicker, FieldRow, HeatPreview });
