// ui.jsx — shared Ori components (exported to window)
const { useState: useStateUI, useEffect: useEffectUI, useRef: useRefUI } = React;

function Meter({ level, max = 5, h = 13 }) {
  return (
    <div className="px-meter">
      {Array.from({ length: max }).map((_, i) =>
      <i key={i} style={{ background: i <= level ? `var(--heat-${Math.min(level, 4)})` : "var(--line)",
        height: h + i * 2.5 }} />
      )}
    </div>);

}

function HeatTag({ k, ember }) {
  return (
    <span className="heat-tag" style={{ background: `var(--heat-${k}-bg)`, color: `var(--heat-${k})` }}>
      <PixelIcon name="flame" size={11} color={`var(--heat-${k})`} className={k === 4 ? "is-ember" : ""} />
      {window.HEAT_NAMES[k]}
    </span>);

}

function HeatDot({ k, size = 11 }) {
  return <span style={{ width: size, height: size, borderRadius: 3, background: `var(--heat-${k})`,
    display: "inline-block", flexShrink: 0 }} className={k === 4 ? "is-ember" : ""} />;
}

function CatDot({ cat }) {
  const c = window.CATS[cat];
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--ink-3)" }}>
    <span style={{ width: 8, height: 8, borderRadius: 2, background: c.color }} />{c.name}
  </span>;
}

function Check({ done, onToggle, size = 26 }) {
  const [burst, setBurst] = useStateUI(false);
  const click = (e) => {
    e.stopPropagation();
    if (!done) {setBurst(true);setTimeout(() => setBurst(false), 480);}
    onToggle && onToggle();
  };
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <div className={"px-check" + (burst ? " check-pop" : "")} data-on={done} onClick={click}
      style={{ width: size, height: size }}>
        <PixelIcon name="check" size={size * 0.6} color="var(--on-accent)" />
      </div>
      {burst &&
      <span className="spark-burst">
          <PixelIcon name="spark" size={size * 1.6} color="var(--heat-2)" />
        </span>
      }
    </div>);

}

function Countdown({ task, big, size }) {
  const c = window.countdown(task);
  const k = window.computeHeat(task);
  const fs = size || (big ? 21 : 13);
  return (
    <span className="px" style={{ fontSize: fs, color: c.over ? "var(--heat-4)" : `var(--heat-${k})`,
      whiteSpace: big ? "normal" : "nowrap", lineHeight: 1.05, display: "inline-block", textAlign: "right" }}>
      {c.label}
    </span>);

}

// the workhorse list row — calm: one tidy meta line, flat card
function TaskRow({ task, onToggle, onOpen, compact }) {
  const k = window.computeHeat(task);
  const c = window.countdown(task);
  const pad = compact ? "9px 12px" : "11px 13px";
  return (
    <div className="px-card flat tap" onClick={() => onOpen && onOpen(task)}
    style={{ display: "flex", alignItems: "center", gap: 11, padding: pad, cursor: "pointer",
      borderLeft: `6px solid var(--heat-${k})`, opacity: task.done ? 0.6 : 1 }}>
      <Check done={task.done} onToggle={() => onToggle(task.id)} size={compact ? 22 : 25} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: compact ? 14.5 : 15.5, lineHeight: 1.2,
          textDecoration: task.done ? "line-through" : "none", color: task.done ? "var(--ink-3)" : "var(--ink)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.title}</div>
        <div style={{ display: "flex", gap: 7, alignItems: "center", marginTop: 3 }}>
          <PixelIcon name={task.type === "daily" ? "repeat" : "target"} size={10} color="var(--ink-3)" />
          <span style={{ width: 7, height: 7, borderRadius: 2, background: window.CATS[task.cat].color, display: "inline-block" }} />
          <span style={{ fontSize: 12, color: c.over ? "var(--heat-4)" : "var(--ink-3)", whiteSpace: "nowrap" }}>{c.label}</span>
        </div>
      </div>
      {!task.done && <HeatTag k={k} />}
    </div>);

}

function SectionLabel({ icon, children, right }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 0 2px", padding: "0 2px" }}>
      {icon && <PixelIcon name={icon} size={13} color="var(--ink-3)" />}
      <span className="eyebrow">{children}</span>
      <div style={{ flex: 1, height: 2, background: "var(--line)", marginLeft: 4 }} />
      {right}
    </div>);

}

// bottom tab bar — center raised Add
function TabBar({ active, onChange, onAdd }) {
  const items = [
  { id: "today", icon: "list", label: "Today" },
  { id: "calendar", icon: "calendar", label: "Plan" },
  { id: "add" },
  { id: "deadlines", icon: "flame", label: "Due" },
  { id: "you", icon: "user", label: "You" }];

  return (
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 40,
      paddingBottom: 26, paddingTop: 10, background: "var(--surface)",
      borderTop: "2px solid var(--line-2)",
      display: "grid", gridTemplateColumns: "repeat(5,1fr)", alignItems: "end" }}>
      {items.map((it) => it.id === "add" ?
      <div key="add" style={{ display: "grid", placeItems: "center" }}>
          <button className="px-btn" onClick={onAdd} aria-label="Add task"
        style={{ width: 56, height: 56, padding: 0, borderRadius: 16, transform: "translateY(-12px)" }}>
            <PixelIcon name="plus" size={22} color="var(--on-accent)" />
          </button>
        </div> :

      <button key={it.id} onClick={() => onChange(it.id)}
      style={{ background: "none", border: "none", cursor: "pointer", display: "grid", justifyItems: "center",
        gap: 4, padding: "2px 0" }}>
          <PixelIcon name={it.icon} size={21} color={active === it.id ? "var(--accent)" : "var(--ink-3)"}
        className={active === it.id && it.id === "deadlines" ? "is-ember" : ""} />
          <span className="px" style={{ fontSize: 10, letterSpacing: ".02em",
          color: active === it.id ? "var(--accent)" : "var(--ink-3)" }}>{it.label}</span>
        </button>
      )}
    </div>);

}

// top chrome — sticky header with logo, brand, + button, and segmented tabs
function TopChrome({ tab, onChange, onAdd, heat }) {
  const items = [
  { id: "today", label: "Today", icon: "list" },
  { id: "calendar", label: "Plan", icon: "calendar" },
  { id: "deadlines", label: "Due", icon: "flame" },
  { id: "you", label: "You", icon: "user" }];

  return (
    <div style={{ flexShrink: 0, padding: "58px 14px 12px", background: "var(--paper)",
      borderBottom: "2px solid var(--line)", zIndex: 5, lineHeight: "1" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <window.FlameMark size={36} />
          <span className="px" style={{ fontSize: 22, color: "var(--ink)", letterSpacing: ".01em" }}>Ori</span>
        </div>
        <button onClick={onAdd} className="px-btn" aria-label="Add task"
        style={{ width: 40, height: 40, padding: 0, borderRadius: 11 }}>
          <PixelIcon name="plus" size={16} color="var(--on-accent)" />
        </button>
      </div>
      <div style={{ display: "flex", gap: 3, background: "var(--sunken)", border: "2px solid var(--line)",
        borderRadius: 12, padding: 3, height: "45px" }}>
        {items.map((it) => {
          const on = tab === it.id;
          return (
            <button key={it.id} onClick={() => onChange(it.id)} className="tap"
            style={{ flex: 1, padding: "7px 4px", borderRadius: 9, border: "none", cursor: "pointer",
              background: on ? "var(--surface)" : "transparent",
              boxShadow: on ? "0 2px 0 var(--shadow)" : "none",
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5,
              fontFamily: "var(--font-pixel)", letterSpacing: "var(--pixel-tracking)",
              fontSize: 13, color: on ? "var(--accent)" : "var(--ink-3)",
              transition: "background .12s, color .12s, transform .09s ease" }}>
              <PixelIcon name={it.icon} size={11} color={on ? "var(--accent)" : "var(--ink-3)"} />
              {it.label}
            </button>);

        })}
      </div>
    </div>);

}

// bottom sheet
function Sheet({ open, onClose, children, maxH = "88%" }) {
  const [mounted, setMounted] = useStateUI(open);
  useEffectUI(() => {if (open) setMounted(true);}, [open]);
  if (!mounted && !open) return null;
  return (
    <div onClick={onClose} style={{ position: "absolute", inset: 0, zIndex: 60,
      display: "flex", alignItems: "flex-end",
      background: open ? "oklch(0.2 0.02 56 / 0.45)" : "transparent",
      transition: "background .25s", backdropFilter: open ? "blur(1.5px)" : "none" }}
    onTransitionEnd={() => {if (!open) setMounted(false);}}>
      <div onClick={(e) => e.stopPropagation()} className="ori-scroll"
      style={{ width: "100%", maxHeight: maxH, background: "var(--paper)",
        borderTop: "3px solid var(--line-2)",
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        transform: open ? "translateY(0)" : "translateY(102%)",
        transition: "transform .28s cubic-bezier(.2,.8,.2,1)",
        boxShadow: "0 -10px 40px var(--shadow)", paddingBottom: 30 }}>
        <div style={{ display: "grid", placeItems: "center", padding: "10px 0 4px" }}>
          <div style={{ width: 44, height: 5, borderRadius: 3, background: "var(--line-2)" }} />
        </div>
        {children}
      </div>
    </div>);

}

// segmented pixel toggle (e.g. Daily / Once)
function PxSegment({ value, options, onChange, full }) {
  return (
    <div style={{ display: "inline-flex", background: "var(--sunken)", border: "2px solid var(--line)",
      borderRadius: 11, padding: 3, gap: 3, width: full ? "100%" : "auto" }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button key={o.value} onClick={() => onChange(o.value)}
          style={{ flex: full ? 1 : "none", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
            border: "none", cursor: "pointer", padding: "8px 14px", borderRadius: 8,
            fontFamily: "var(--font-pixel)", letterSpacing: "var(--pixel-tracking)", fontSize: 14,
            background: on ? "var(--surface)" : "transparent",
            boxShadow: on ? "0 2px 0 var(--shadow)" : "none",
            color: on ? "var(--accent)" : "var(--ink-3)" }}>
            {o.icon && <PixelIcon name={o.icon} size={12} color={on ? "var(--accent)" : "var(--ink-3)"} />}
            {o.label}
          </button>);

      })}
    </div>);

}

Object.assign(window, { Meter, HeatTag, HeatDot, CatDot, Check, Countdown, TaskRow, SectionLabel, TabBar, TopChrome, Sheet, PxSegment });