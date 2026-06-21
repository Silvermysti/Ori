// calendar.jsx — Plan: month calendar + per-day detail with duration-based load
const { useState: useStateCal, useMemo: useMemoCal } = React;
const DOW = ["M", "T", "W", "T", "F", "S", "S"];

function loadHeat(mins, cap) {
  const r = mins / cap;
  return r >= 1 ? 4 : r >= 0.8 ? 3 : r >= 0.5 ? 2 : r > 0 ? 1 : 0;
}

function MonthGrid({ year, month, tasks, selected, onSelect, cap }) {
  const cells = useMemoCal(() => window.monthGrid(year, month), [year, month]);
  return (
    <div style={{ background: "var(--surface)", border: "2px solid var(--line-2)", borderRadius: 14,
      boxShadow: "0 4px 0 var(--shadow)", padding: "12px 10px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 0, marginBottom: 6 }}>
        {DOW.map((l, i) => (
          <div key={i} className="eyebrow" style={{ textAlign: "center", fontSize: 9.5, padding: "2px 0", color: "var(--ink-3)" }}>{l}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
        {cells.map((c, i) => {
          const isToday = window.sameDay(c.date, window.TODAY);
          const isSel = window.sameDay(c.date, selected);
          const past = c.date < window.TODAY && !isToday;
          const load = past ? 0 : window.dayLoadMins(tasks, c.date);
          const k = loadHeat(load, cap);
          return (
            <button key={i} onClick={() => onSelect(c.date)} className="tap"
              style={{ position: "relative", padding: 0, border: "none", cursor: "pointer",
                aspectRatio: "1 / 1", borderRadius: 8, background: isSel ? "var(--sunken)" : "transparent",
                boxShadow: isSel ? "inset 0 0 0 2px var(--accent)" : "none",
                opacity: c.inMonth ? 1 : 0.35, display: "grid", placeItems: "center" }}>
              <div style={{ position: "absolute", inset: 4, borderRadius: 6,
                background: isToday && !isSel ? "var(--heat-1-bg)" : "transparent" }} />
              <span className="px" style={{ position: "relative", fontSize: 13,
                color: isToday ? "var(--accent)" : (past ? "var(--ink-3)" : "var(--ink)") }}>{c.date.getDate()}</span>
              {load > 0 && (
                <div style={{ position: "absolute", bottom: 4, left: "50%", transform: "translateX(-50%)",
                  display: "flex", gap: 1.5 }}>
                  {Array.from({ length: Math.min(4, Math.max(1, Math.round(load / (cap / 4)))) }).map((_, j) => (
                    <span key={j} style={{ width: 4, height: 4, borderRadius: 1, background: `var(--heat-${k})` }} />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CapacityMeter({ load, cap }) {
  const base = Math.round(cap / 30);
  const filled = Math.round(load / 30);
  const over = Math.max(0, filled - base);
  const k = loadHeat(load, cap) || 1;
  return (
    <div style={{ display: "flex", gap: 3, alignItems: "center", flexWrap: "wrap" }}>
      {Array.from({ length: base }).map((_, i) => (
        <i key={i} style={{ width: 13, height: 16, borderRadius: 2,
          background: i < Math.min(filled, base) ? `var(--heat-${k})` : "var(--line)" }} />
      ))}
      {over > 0 && <span style={{ width: 2, height: 18, background: "var(--heat-4)", margin: "0 2px" }} />}
      {Array.from({ length: over }).map((_, i) => (
        <i key={"o" + i} style={{ width: 13, height: 16, borderRadius: 2, background: "var(--heat-4)" }} />
      ))}
    </div>
  );
}

function PlanRow({ task, onOpen, onMove }) {
  const k = window.computeHeat(task);
  const movable = task.type === "once";
  return (
    <div className="px-card flat tap" onClick={() => onOpen(task)} style={{ display: "flex", alignItems: "center", gap: 11,
      padding: "10px 12px", cursor: "pointer", borderLeft: `6px solid var(--heat-${k})` }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{task.title}</div>
        <div style={{ display: "flex", gap: 7, alignItems: "center", marginTop: 3 }}>
          <PixelIcon name="clock" size={10} color="var(--ink-3)" />
          <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{window.fmtDur(task.dur)}</span>
          <span style={{ width: 7, height: 7, borderRadius: 2, background: window.CATS[task.cat].color }} />
        </div>
      </div>
      {movable && (
        <div onClick={e => e.stopPropagation()} style={{ display: "flex", gap: 4 }}>
          <button onClick={() => onMove(task.id, window.addDays(task.planDate || window.TODAY, -1))}
            className="px-btn ghost" style={{ padding: "5px 7px", boxShadow: "none" }}>
            <PixelIcon name="chevL" size={11} color="var(--ink)" /></button>
          <button onClick={() => onMove(task.id, window.addDays(task.planDate || window.TODAY, 1))}
            className="px-btn ghost" style={{ padding: "5px 7px", boxShadow: "none" }}>
            <PixelIcon name="chevR" size={11} color="var(--ink)" /></button>
        </div>
      )}
    </div>
  );
}

function CalendarScreen({ tasks, onOpen, onMovePlan, dailyCap }) {
  const cap = dailyCap || window.DAILY_CAP;
  const [view, setView] = useStateCal({ year: window.TODAY.getFullYear(), month: window.TODAY.getMonth() });
  const [selected, setSelected] = useStateCal(window.TODAY);

  const monthName = new Date(view.year, view.month, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const onceForDay = tasks.filter(t => t.type === "once" && !t.done && t.planDate && window.sameDay(t.planDate, selected));
  const dailies = window.sameDay(selected, window.TODAY) ? tasks.filter(t => t.type === "daily" && !t.done) : [];
  const anytime = tasks.filter(t => t.type === "once" && !t.done && !t.planDate);
  const load = window.dayLoadMins(tasks, selected);
  const overCap = load - cap;

  // balance hint: heaviest future day in current month
  const futureCells = window.monthGrid(view.year, view.month)
    .filter(c => c.inMonth && c.date >= window.TODAY)
    .map(c => ({ date: c.date, m: window.dayLoadMins(tasks, c.date) }));
  const heavy = futureCells.reduce((a, b) => b.m > a.m ? b : a, { date: null, m: 0 });
  const light = futureCells.reduce((a, b) => (b.m < a.m && b.m >= 0) ? b : a, { date: null, m: Infinity });

  const stepMonth = (n) => {
    const d = new Date(view.year, view.month + n, 1);
    setView({ year: d.getFullYear(), month: d.getMonth() });
  };

  return (
    <div className="ori-scroll" style={{ height: "100%", padding: "18px 16px 32px" }}>
      <div className="eyebrow" style={{ marginBottom: 2 }}>set tasks by date</div>
      <div className="px" style={{ fontSize: 30, lineHeight: .95, color: "var(--ink)", marginBottom: 14 }}>Plan</div>

      {/* month nav */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <button onClick={() => stepMonth(-1)} className="px-btn ghost" style={{ padding: "6px 10px" }}>
          <PixelIcon name="chevL" size={12} color="var(--ink)" /></button>
        <span className="px" style={{ fontSize: 16, color: "var(--ink)" }}>{monthName}</span>
        <button onClick={() => stepMonth(1)} className="px-btn ghost" style={{ padding: "6px 10px" }}>
          <PixelIcon name="chevR" size={12} color="var(--ink)" /></button>
      </div>

      <MonthGrid year={view.year} month={view.month} tasks={tasks}
        selected={selected} onSelect={setSelected} cap={cap} />

      {/* balance nudge */}
      {heavy.m > cap && light.date && !window.sameDay(heavy.date, light.date) && (
        <div className="px-card flat" style={{ padding: "10px 12px", margin: "12px 0 4px", display: "flex", gap: 10, alignItems: "center",
          borderLeft: "6px solid var(--heat-3)" }}>
          <PixelIcon name="bolt" size={16} color="var(--heat-3)" />
          <div style={{ flex: 1, fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.35 }}>
            <b style={{ color: "var(--ink)" }}>{window.planLabel(heavy.date)}</b> is over by {window.fmtDur(heavy.m - cap)}.
            Move a task to {window.planLabel(light.date)} to balance.
          </div>
        </div>
      )}

      {/* selected-day detail */}
      <div className="px-panel" style={{ padding: 16, marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
          <span className="px" style={{ fontSize: 17, color: "var(--ink)" }}>
            {selected.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</span>
          <span className="px" style={{ fontSize: 12.5, color: overCap > 0 ? "var(--heat-4)" : "var(--ink-2)" }}>
            {window.fmtDur(load)} / {window.fmtDur(cap)}{overCap > 0 ? " · over" : ""}</span>
        </div>
        <CapacityMeter load={load} cap={cap} />

        <div style={{ display: "grid", gap: "var(--gap)", marginTop: 14 }}>
          {dailies.length > 0 && (
            <React.Fragment>
              <window.SectionLabel icon="repeat">Daily · resets midnight</window.SectionLabel>
              {dailies.map(t => <PlanRow key={t.id} task={t} onOpen={onOpen} onMove={onMovePlan} />)}
            </React.Fragment>
          )}
          {onceForDay.length > 0 && (
            <React.Fragment>
              <window.SectionLabel icon="target">Planned</window.SectionLabel>
              {onceForDay.map(t => <PlanRow key={t.id} task={t} onOpen={onOpen} onMove={onMovePlan} />)}
            </React.Fragment>
          )}
          {onceForDay.length === 0 && dailies.length === 0 && (
            <div style={{ textAlign: "center", padding: "16px 0", display: "grid", justifyItems: "center", gap: 8 }}>
              <span className="px" style={{ fontSize: 12, color: "var(--ink-3)" }}>a free day · drop a task here</span>
            </div>
          )}
        </div>
      </div>

      {/* anytime pool */}
      {anytime.length > 0 && (
        <div style={{ marginTop: 22 }}>
          <window.SectionLabel icon="dot">Anytime · no date yet</window.SectionLabel>
          <div style={{ display: "grid", gap: "var(--gap)", marginTop: 8 }}>
            {anytime.map(t => (
              <div key={t.id} className="px-card flat tap" onClick={() => onOpen(t)} style={{ display: "flex", alignItems: "center", gap: 11,
                padding: "10px 12px", cursor: "pointer", borderLeft: `6px solid var(--heat-${window.computeHeat(t)})` }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14.5 }}>{t.title}</div>
                  <div style={{ display: "flex", gap: 7, alignItems: "center", marginTop: 3 }}>
                    <PixelIcon name="clock" size={10} color="var(--ink-3)" />
                    <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{window.fmtDur(t.dur)}</span>
                  </div>
                </div>
                <button onClick={e => { e.stopPropagation(); onMovePlan(t.id, selected); }} className="px-btn"
                  style={{ padding: "7px 11px", fontSize: 12 }}>
                  <PixelIcon name="plus" size={11} color="var(--on-accent)" /> {window.planLabel(selected)}</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
Object.assign(window, { CalendarScreen });
