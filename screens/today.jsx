import React from "react";
// today.jsx — home screen (list-first, grouped by heat)
function TodayScreen({ tasks, onToggle, onOpen, layout = "heat" }) {
  const [grouping, setGrouping] = React.useState(layout);
  const live = tasks.map((t) => ({ ...t, _k: window.computeHeat(t) }));
  const open = live.filter((t) => !t.done);
  const done = live.filter((t) => t.done);

  const leftCount = open.length;
  const onFire = open.filter((t) => t._k >= 3).length;
  const planMins = open.reduce((s, t) => s + (t.dur || 0), 0);
  const fmtH = (m) => m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? " " + m % 60 + "m" : ""}` : `${m}m`;

  /* ── week bar chart ── */
  const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];
  const dayOfWeek = (window.TODAY.getDay() + 6) % 7;
  const weekStart = window.addDays(window.TODAY, -dayOfWeek);
  const MAX_BAR_H = 90;

  const weekData = Array.from({ length: 7 }, (_, i) => {
    const day = window.addDays(weekStart, i);
    const isToday = window.sameDay(day, window.TODAY);
    const isPast = !isToday && day < window.TODAY;
    // dailies recur on EVERY day; one-time tasks belong to their planned date
    const dayTasks = tasks.filter((t) =>
    t.type === "daily" ? true : t.planDate && window.sameDay(t.planDate, day));
    const total = dayTasks.length;
    // completion: today uses live ticks; past days are history (done);
    // future dailies reset to pending, so only already-ticked one-times count
    const doneCount = isToday ?
    dayTasks.filter((t) => t.done).length :
    isPast ?
    total :
    dayTasks.filter((t) => t.type === "once" && t.done).length;
    const fill = total ? doneCount / total : 0; // 0 = hollow, 1 = full
    // heat colour (intrinsic, ignores done): dailies only run hot on today,
    // they're calm on other days; one-times use their deadline-based heat
    const heatOf = (t) =>
    t.type === "daily" ? isToday ? window.computeHeat({ ...t, done: false }) : 1 :
    window.computeHeat({ ...t, done: false });
    const maxHeat = total ? Math.max(...dayTasks.map(heatOf)) : 0;
    return { isToday, isPast, total, doneCount, fill, maxHeat };
  });

  /* ── grouping ── */
  let groups;
  if (grouping === "type") {
    groups = [
    { label: "Daily · resets at midnight", icon: "repeat", items: open.filter((t) => t.type === "daily") },
    { label: "One-time", icon: "target", items: open.filter((t) => t.type === "once") }];

  } else if (grouping === "flat") {
    groups = [{ label: "All tasks", icon: "list", items: [...open].sort((a, b) => b._k - a._k) }];
  } else {
    groups = [
    { label: "On fire · do now", icon: "flame", items: open.filter((t) => t._k >= 3).sort((a, b) => b._k - a._k) },
    { label: "Warming up", icon: "clock", items: open.filter((t) => t._k === 2) },
    { label: "Still cool", icon: "dot", items: open.filter((t) => t._k <= 1) }];

  }
  groups = groups.filter((g) => g.items.length);

  const hour = window.NOW.getHours();
  const greet = hour < 12 ? "good morning" : hour < 18 ? "good afternoon" : "good evening";

  return (
    <div className="ori-scroll" style={{ height: "100%", padding: "18px 16px 32px" }}>

      {/* greeting */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 2 }}>{greet}</div>
          <div className="px" style={{ fontSize: 30, lineHeight: .9, color: "var(--ink)" }}>{window.TODAY.toLocaleDateString("en-US", { weekday: "long" })}</div>
          <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 4 }}>{window.TODAY.toLocaleDateString("en-US", { month: "long", day: "numeric" })} · {leftCount} left · {fmtH(planMins)}</div>
        </div>
        {onFire > 0 &&
        <div style={{ textAlign: "right" }}>
            <div className="px" style={{ fontSize: 22, color: "var(--heat-4)", lineHeight: 1 }}>{onFire}</div>
            <div className="eyebrow" style={{ fontSize: 9, marginTop: 3 }}>on fire</div>
          </div>
        }
      </div>

      {/* ── week bar chart ── */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
          <span className="eyebrow" style={{ fontSize: 9 }}>this week</span>
          <span style={{ fontSize: 11, color: "var(--ink-3)" }}>{fmtH(planMins)} today</span>
        </div>
        <div style={{ display: "flex", gap: 5, alignItems: "flex-end", height: "120px" }}>
          {weekData.map((d, i) => {
            const color = `var(--heat-${d.maxHeat})`;
            const allDone = d.total > 0 && d.doneCount === d.total;
            return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column",
                alignItems: "center", gap: 5, justifyContent: "flex-end" }}>
                {d.isToday &&
                <div style={{ width: 4, height: 4, borderRadius: "50%",
                  background: "var(--accent)", flexShrink: 0 }} />
                }
                {/* hollow track — fills bottom→top as that day's tasks get ticked */}
                <div title={d.total ? `${d.doneCount}/${d.total} done` : "nothing planned"}
                  style={{ position: "relative", width: 18, height: MAX_BAR_H, flexShrink: 0,
                    borderRadius: 5, overflow: "hidden",
                    border: `2px solid ${d.total ? color : "var(--line)"}`,
                    background: "var(--surface)", opacity: d.isPast ? 0.5 : 1 }}>
                  <div style={{ position: "absolute", left: 0, right: 0, bottom: 0,
                    height: `${Math.round(d.fill * 100)}%`, background: color,
                    boxShadow: allDone ? `0 0 0 1px ${color} inset` : "none",
                    transition: "height .42s cubic-bezier(.2,.8,.2,1)" }} />
                </div>
                <span className="px" style={{ fontSize: 9, lineHeight: 1, flexShrink: 0,
                  color: d.isToday ? "var(--accent)" : "var(--ink-3)" }}>
                  {DAY_LABELS[i]}
                </span>
              </div>);

          })}
        </div>
      </div>

      {/* groups */}
      <div style={{ display: "grid", gap: 18 }}>
        {open.length === 0 &&
        <div style={{ textAlign: "center", padding: "26px 0 14px", display: "grid", justifyItems: "center", gap: 10 }}>
            <window.OriBuddy heat={0} mood="happy" size={64} className="buddy-bob" />
            <div className="px" style={{ fontSize: 17, color: "var(--ink)" }}>all clear!</div>
            <div style={{ fontSize: 13, color: "var(--ink-3)" }}>nothing's heating up — go enjoy the day</div>
          </div>
        }
        {groups.map((g, gi) => {
          const countBadge =
          <span className="px" style={{ fontSize: 12, color: "var(--ink-3)" }}>{g.items.length}</span>;

          const groupDropdown =
          <div style={{ position: "relative", display: "inline-block" }}>
              <select value={grouping} onChange={(e) => setGrouping(e.target.value)}
            style={{ appearance: "none", WebkitAppearance: "none",
              background: "var(--surface)", border: "2px solid var(--line-2)",
              borderRadius: 7, padding: "3px 20px 3px 7px",
              fontFamily: "var(--font-pixel)", letterSpacing: "var(--pixel-tracking)",
              fontSize: 11, color: "var(--accent)", cursor: "pointer",
              boxShadow: "0 2px 0 var(--shadow)", outline: "none", height: "25px", textAlign: "center", width: "85px" }}>
                <option value="heat">By heat</option>
                <option value="type">By type</option>
                <option value="flat">All tasks</option>
              </select>
              <window.PixelIcon name="chevD" size={8} color="var(--ink-3)"
            style={{ position: "absolute", right: 6, top: "50%",
              transform: "translateY(-50%)", pointerEvents: "none" }} />
            </div>;

          return (
            <div key={g.label} style={{ display: "grid", gap: "var(--gap)" }}>
              <window.SectionLabel icon={g.icon}
              right={
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {countBadge}{gi === 0 && groupDropdown}
                  </div>
              }>
                {g.label}
              </window.SectionLabel>
              {g.items.map((t) =>
              <window.TaskRow key={t.id} task={t} onToggle={onToggle} onOpen={onOpen} />
              )}
            </div>);

        })}

        {done.length > 0 &&
        <div style={{ display: "grid", gap: "var(--gap)" }}>
            <window.SectionLabel icon="check"
          right={<span className="px" style={{ fontSize: 12, color: "var(--ink-3)" }}>{done.length}</span>}>
              Done today
            </window.SectionLabel>
            {done.map((t) =>
          <window.TaskRow key={t.id} task={t} onToggle={onToggle} onOpen={onOpen} compact />
          )}
          </div>
        }
      </div>
    </div>);

}
Object.assign(window, { TodayScreen });