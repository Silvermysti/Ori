// addtask.jsx — quick-add bottom sheet
const { useState: useStateAdd } = React;
const ADD_QUICK = [
  { label: "Anytime", get: () => null },
  { label: "Today", get: () => window.TODAY },
  { label: "Tomorrow", get: () => window.addDays(window.TODAY, 1) },
  { label: "Next week", get: () => window.addDays(window.TODAY, 7) },
];

function MiniToggle({ on, onChange }) {
  return (
    <button onClick={() => onChange(!on)}
      style={{ width: 46, height: 26, borderRadius: 8, border: "2px solid var(--line-2)", cursor: "pointer",
        background: on ? "var(--accent)" : "var(--sunken)", position: "relative", padding: 0, flexShrink: 0 }}>
      <span style={{ position: "absolute", top: 2, left: on ? 22 : 2, width: 18, height: 18, borderRadius: 5,
        background: "var(--surface)", boxShadow: "0 2px 0 var(--shadow)", transition: "left .15s" }} />
    </button>
  );
}

function Pill({ on, children, onClick }) {
  return (
    <button onClick={onClick}
      style={{ padding: "7px 12px", borderRadius: 9, cursor: "pointer", fontSize: 13, fontWeight: 650,
        border: `2px solid ${on ? "var(--accent)" : "var(--line)"}`, background: on ? "var(--surface)" : "transparent",
        color: on ? "var(--accent)" : "var(--ink-3)", boxShadow: on ? "0 3px 0 var(--shadow)" : "none" }}>{children}</button>
  );
}

function AddSheet({ open, onClose, onAdd }) {
  const blank = { title: "", type: "once", cat: "work", durOn: true, dur: 30, by: 1020, byOn: false,
    planDate: window.TODAY, dayOffset: 0, dlTime: 1020, allDay: false };
  const [f, setF] = useStateAdd(blank);
  const set = p => setF(prev => ({ ...prev, ...p }));

  const buildDeadline = () => {
    const nd = new Date(window.NOW);
    nd.setDate(nd.getDate() + f.dayOffset);
    if (f.allDay) nd.setHours(23, 59, 0, 0);
    else nd.setHours(Math.floor(f.dlTime / 60), f.dlTime % 60, 0, 0);
    return nd;
  };

  const submit = () => {
    if (!f.title.trim()) return;
    const t = { id: window.uid(), title: f.title.trim(), type: f.type, cat: f.cat,
      dur: f.durOn ? f.dur : null, done: false };
    if (f.type === "daily") { t.by = f.byOn ? f.by : null; }
    else { t.deadline = buildDeadline(); t.allDay = f.allDay; t.planDate = f.planDate; }
    onAdd(t);
    setF(blank);
    onClose();
  };

  const preview = f.type === "daily"
    ? { type: "daily", by: f.byOn ? f.by : null, done: false }
    : { type: "once", deadline: buildDeadline(), allDay: f.allDay, done: false };
  const k = window.computeHeat(preview);

  return (
    <window.Sheet open={open} onClose={onClose}>
      <div style={{ padding: "8px 18px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span className="px" style={{ fontSize: 20, color: "var(--ink)", whiteSpace: "nowrap" }}>New task</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 6 }}>
            <PixelIcon name="x" size={16} color="var(--ink-3)" /></button>
        </div>

        <input autoFocus value={f.title} onChange={e => set({ title: e.target.value })}
          onKeyDown={e => e.key === "Enter" && submit()} placeholder="What needs doing?"
          style={{ width: "100%", padding: "13px 14px", borderRadius: 12, border: "2px solid var(--line-2)",
            background: "var(--surface)", color: "var(--ink)", fontFamily: "var(--font-body)", fontSize: 17,
            fontWeight: 600, outline: "none", marginBottom: 16, boxShadow: "0 3px 0 var(--shadow)" }} />

        <div style={{ marginBottom: 16 }}>
          <window.PxSegment full value={f.type} onChange={v => set({ type: v })} options={[
            { value: "once", label: "ONE-TIME", icon: "target" },
            { value: "daily", label: "DAILY", icon: "repeat" },
          ]} />
        </div>

        {f.type === "once" ? (
          <React.Fragment>
            <window.FieldRow label="Deadline">
              <div style={{ display: "flex", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                {[["Today", 0], ["Tomorrow", 1], ["+3 days", 3], ["Next week", 7]].map(([l, o]) => (
                  <Pill key={l} on={f.dayOffset === o} onClick={() => set({ dayOffset: o })}>{l}</Pill>
                ))}
              </div>
              <div className="px-card flat" style={{ padding: "10px 12px", display: "grid", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "var(--ink-2)" }}>All-day · no fixed time</span>
                  <MiniToggle on={f.allDay} onChange={v => set({ allDay: v })} />
                </div>
                {!f.allDay && (
                  <React.Fragment>
                    <div style={{ height: 2, background: "var(--line)" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 13, color: "var(--ink-2)" }}>Time</span>
                      <window.Stepper value={f.dlTime} onChange={v => set({ dlTime: v })} step={30} min={0} max={1410} fmt={window.fmtTime} />
                    </div>
                  </React.Fragment>
                )}
              </div>
            </window.FieldRow>

            <div style={{ height: 14 }} />
            <window.FieldRow label="Plan for">
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 8 }}>
                {ADD_QUICK.map(q => {
                  const target = q.get();
                  const on = (target == null && f.planDate == null)
                    || (target != null && f.planDate != null && window.sameDay(f.planDate, target));
                  return <Pill key={q.label} on={on} onClick={() => set({ planDate: target })}>{q.label}</Pill>;
                })}
              </div>
              <div className="px-card flat" style={{ padding: "9px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "var(--ink-2)" }}>Pick a date</span>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button onClick={() => set({ planDate: window.addDays(f.planDate || window.TODAY, -1) })}
                    className="px-btn ghost" style={{ padding: "5px 9px", fontSize: 15 }}>−</button>
                  <span className="px" style={{ fontSize: 13.5, minWidth: 92, textAlign: "center" }}>
                    {f.planDate ? f.planDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : "—"}</span>
                  <button onClick={() => set({ planDate: window.addDays(f.planDate || window.TODAY, 1) })}
                    className="px-btn ghost" style={{ padding: "5px 9px", fontSize: 15 }}>+</button>
                </div>
              </div>
            </window.FieldRow>
          </React.Fragment>
        ) : (
          <window.FieldRow label="Finish by a time">
            <div className="px-card flat" style={{ padding: "10px 12px", display: "grid", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "var(--ink-2)" }}>Aim for a target time</span>
                <MiniToggle on={f.byOn} onChange={v => set({ byOn: v })} />
              </div>
              {f.byOn && (
                <React.Fragment>
                  <div style={{ height: 2, background: "var(--line)" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: "var(--ink-2)" }}>By</span>
                    <window.Stepper value={f.by} onChange={v => set({ by: v })} step={30} min={0} max={1410} fmt={window.fmtTime} />
                  </div>
                </React.Fragment>
              )}
            </div>
          </window.FieldRow>
        )}

        <div style={{ height: 16 }} />
        <window.FieldRow label="Category"><window.CatPicker value={f.cat} onChange={v => set({ cat: v })} /></window.FieldRow>

        <div style={{ height: 16 }} />
        <window.FieldRow label="Estimated time">
          <div className="px-card flat" style={{ padding: "10px 12px", display: "grid", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "var(--ink-2)" }}>Add an estimate · feeds your load</span>
              <MiniToggle on={f.durOn} onChange={v => set({ durOn: v })} />
            </div>
            {f.durOn && (
              <React.Fragment>
                <div style={{ height: 2, background: "var(--line)" }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "var(--ink-2)" }}>Duration</span>
                  <window.Stepper value={f.dur} onChange={v => set({ dur: v })} step={5} min={5} max={240}
                    fmt={m => m >= 60 ? `${Math.floor(m / 60)}h ${m % 60 ? m % 60 + "m" : ""}` : m + "m"} />
                </div>
              </React.Fragment>
            )}
          </div>
        </window.FieldRow>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 18 }}>
          <span className="eyebrow">starts as</span>
          <window.HeatTag k={k} />
        </div>

        <button className="px-btn" onClick={submit} disabled={!f.title.trim()}
          style={{ width: "100%", marginTop: 14, opacity: f.title.trim() ? 1 : .5 }}>
          <PixelIcon name="plus" size={14} color="var(--on-accent)" /> Add task
        </button>
      </div>
    </window.Sheet>
  );
}
Object.assign(window, { AddSheet });
