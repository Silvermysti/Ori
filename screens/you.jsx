// you.jsx — lightweight profile / stats screen
function YouScreen({ tasks }) {
  const doneToday = tasks.filter(t => t.done).length;
  const total = tasks.length;
  const pct = Math.round((doneToday / Math.max(1, tasks.filter(t => t.type === "daily").length + 2)) * 100);
  const stat = (n, l, c) => (
    <div className="px-card" style={{ padding: "14px 12px", textAlign: "center", flex: 1 }}>
      <div className="px" style={{ fontSize: 26, color: c || "var(--ink)" }}>{n}</div>
      <div className="eyebrow" style={{ fontSize: 9, marginTop: 3 }}>{l}</div>
    </div>
  );
  return (
    <div className="ori-scroll" style={{ height: "100%", padding: "18px 16px 32px" }}>
      <div className="eyebrow" style={{ marginBottom: 2 }}>your rhythm</div>
      <div className="px" style={{ fontSize: 34, lineHeight: .95, color: "var(--ink)", marginBottom: 18 }}>You</div>

      <div className="px-panel" style={{ padding: 18, marginBottom: 18, display: "flex", gap: 14, alignItems: "center" }}>
        <div style={{ width: 58, height: 58, borderRadius: 14, background: "var(--heat-1-bg)", display: "grid", placeItems: "center",
          border: "2px solid var(--line-2)", boxShadow: "0 4px 0 var(--shadow)" }}>
          <window.OriBuddy heat={2} mood="happy" size={40} className="buddy-bob" />
        </div>
        <div>
          <div style={{ fontSize: 19, fontWeight: 800 }}>Hey there</div>
          <div style={{ fontSize: 13, color: "var(--ink-2)" }}>{doneToday} done today · keep the streak warm</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
        {stat(<span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><PixelIcon name="heart" size={16} color="var(--heat-3)" />12</span>, "day streak", "var(--heat-3)")}
        {stat(doneToday, "done today")}
        {stat(pct + "%", "of plan", "var(--heat-0)")}
      </div>

      <window.SectionLabel icon="gear">How Ori works</window.SectionLabel>
      <div className="px-card" style={{ padding: 16, marginTop: 8, display: "grid", gap: 13 }}>
        {[
          ["repeat", "Daily tasks", "Refresh every midnight and warm up as the day goes on."],
          ["target", "One-time tasks", "Stay cool, then climb to URGENT about a day before they're due."],
          ["bolt", "Balanced by time", "No fixed slots — Ori spreads tasks across days by estimated duration."],
        ].map(([ic, h, b]) => (
          <div key={h} style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
            <div className="px-inset" style={{ padding: 8, flexShrink: 0 }}><PixelIcon name={ic} size={16} color="var(--accent)" /></div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14.5 }}>{h}</div>
              <div style={{ fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.4 }}>{b}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ textAlign: "center", marginTop: 18, fontSize: 12, color: "var(--ink-3)" }} className="px">
        tip · open Tweaks to reshape the theme
      </div>
    </div>
  );
}
Object.assign(window, { YouScreen });
