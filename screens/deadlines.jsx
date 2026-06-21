import React from "react";
// deadlines.jsx — upcoming one-time deadlines, grouped by bucket
const BUCKET_ORDER = ["Overdue", "Today", "Tomorrow", "This week", "This month", "Later", "Someday"];

function DeadlineRow({ task, onToggle, onOpen }) {
  const k = window.computeHeat(task);
  const c = window.countdown(task);
  return (
    <div className="px-card tap" onClick={() => onOpen(task)}
      style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", cursor: "pointer",
        borderLeft: `6px solid var(--heat-${k})`, opacity: task.done ? .7 : 1 }}>
      <window.Check done={task.done} onToggle={() => onToggle(task.id)} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 16, textDecoration: task.done ? "line-through" : "none",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{task.title}</div>
        <div style={{ display: "flex", gap: 9, alignItems: "center", marginTop: 4 }}>
          <window.CatDot cat={task.cat} />
          <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{task.deadline.toLocaleDateString("en-US", { month: "short", day: "numeric" })}{task.allDay ? " · all day" : " · " + window.fmtTime(task.deadline.getHours() * 60 + task.deadline.getMinutes())}</span>
        </div>
      </div>
      <div className="px-inset" style={{ textAlign: "center", padding: "6px 9px", minWidth: 66,
        borderColor: `var(--heat-${k})`, background: `var(--heat-${k}-bg)` }}>
        <window.Countdown task={task} />
        <div className="eyebrow" style={{ fontSize: 8, marginTop: 2, color: c.over ? "var(--heat-4)" : "var(--ink-3)" }}>
          {c.over ? "overdue" : "left"}</div>
      </div>
    </div>
  );
}

function DeadlinesScreen({ tasks, onToggle, onOpen }) {
  const withDl = tasks.filter(t => t.type === "once" && t.deadline);
  const sorted = [...withDl].sort((a, b) => a.deadline - b.deadline);
  const next = sorted.find(t => !t.done && t.deadline >= window.NOW);

  const grouped = {};
  sorted.forEach(t => {
    const b = window.dueBucket(t);
    (grouped[b] = grouped[b] || []).push(t);
  });

  return (
    <div className="ori-scroll" style={{ height: "100%", padding: "18px 16px 32px" }}>
      <div className="eyebrow" style={{ marginBottom: 2 }}>one-time tasks · by deadline</div>
      <div className="px" style={{ fontSize: 34, lineHeight: .95, color: "var(--ink)", marginBottom: 14 }}>Deadlines</div>

      {/* hero: next deadline */}
      {next && (
        <div className="px-panel tap" onClick={() => onOpen(next)} style={{ padding: 18, marginBottom: 20, cursor: "pointer",
          borderLeft: `6px solid var(--heat-${window.computeHeat(next)})` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span className="eyebrow" style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
              <window.PixelIcon name="target" size={11} color="var(--accent)" /> next deadline</span>
            <window.HeatTag k={window.computeHeat(next)} />
          </div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{next.title}</div>
          <div className="px" style={{ margin: "8px 0 2px", lineHeight: 1 }}>
            <window.Countdown task={next} size={34} />
          </div>
          <div style={{ fontSize: 13, color: "var(--ink-2)" }}>
            due {next.deadline.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}{next.allDay ? " · all day" : " · " + window.fmtTime(next.deadline.getHours() * 60 + next.deadline.getMinutes())}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gap: 18 }}>
        {BUCKET_ORDER.filter(b => grouped[b]).map(b => {
          const isOver = b === "Overdue";
          return (
            <div key={b} style={{ display: "grid", gap: "var(--gap)" }}>
              <window.SectionLabel icon={isOver ? "flame" : "calendar"}
                right={<span className="px" style={{ fontSize: 12, color: isOver ? "var(--heat-4)" : "var(--ink-3)" }}>{grouped[b].length}</span>}>
                <span style={{ color: isOver ? "var(--heat-4)" : "inherit" }}>{b}</span>
              </window.SectionLabel>
              {grouped[b].map(t => <DeadlineRow key={t.id} task={t} onToggle={onToggle} onOpen={onOpen} />)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
Object.assign(window, { DeadlinesScreen });
