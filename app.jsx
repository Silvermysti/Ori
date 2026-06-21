// app.jsx — Ori shell: navigation, state, tweaks
const { useState: useApp, useEffect: useAppEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "dark": false,
  "density": "regular",
  "font": "pixelify",
  "accent": ["oklch(0.625 0.142 46)", "oklch(0.555 0.150 40)"],
  "todayLayout": "heat"
} /*EDITMODE-END*/;

function Stage({ children }) {
  const [scale, setScale] = useApp(1);
  useAppEffect(() => {
    const fit = () => setScale(Math.min(1, (window.innerHeight - 32) / 874, (window.innerWidth - 24) / 402));
    fit();window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", overflow: "hidden", textAlign: "left" }}>
      <div style={{ transform: `scale(${scale})`, transformOrigin: "center" }}>{children}</div>
    </div>);

}

function App() {
  const [t, setTweak] = window.useTweaks(TWEAK_DEFAULTS);
  const [tasks, setTasks] = useApp(window.SEED);
  const [tab, setTab] = useApp("today");
  const [detailId, setDetailId] = useApp(null);
  const [addOpen, setAddOpen] = useApp(false);

  const toggle = (id) => setTasks((ts) => ts.map((x) => x.id === id ? { ...x, done: !x.done } : x));
  const save = (u) => setTasks((ts) => ts.map((x) => x.id === u.id ? u : x));
  const del = (id) => setTasks((ts) => ts.filter((x) => x.id !== id));
  const add = (nt) => setTasks((ts) => [nt, ...ts]);
  const movePlan = (id, planDate) => setTasks((ts) => ts.map((x) => x.id === id ? { ...x, planDate } : x));
  const open = (task) => setDetailId(task.id);

  const detailTask = tasks.find((x) => x.id === detailId);

  // hottest open task drives the logo's sand color
  const topHeat = tasks.reduce((m, t) => t.done ? m : Math.max(m, window.computeHeat(t)), 1);

  const rootStyle = { "--accent": t.accent[0], "--accent-2": t.accent[1], height: "100%" };

  let screen;
  if (tab === "today") screen = <window.TodayScreen tasks={tasks} onToggle={toggle} onOpen={open} layout={t.todayLayout} />;else
  if (tab === "calendar") screen = <window.CalendarScreen tasks={tasks} onOpen={open} onMovePlan={movePlan} />;else
  if (tab === "deadlines") screen = <window.DeadlinesScreen tasks={tasks} onToggle={toggle} onOpen={open} />;else
  screen = <window.YouScreen tasks={tasks} />;

  return (
    <React.Fragment>
      <Stage>
        <window.IOSDevice dark={t.dark}>
          <div className="ori-root" data-theme={t.dark ? "dark" : "light"} data-density={t.density} data-font={t.font}
          style={{ ...rootStyle, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <window.TopChrome tab={tab} onChange={setTab} onAdd={() => setAddOpen(true)} heat={topHeat} />
            <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
              <div key={tab} className="screen-enter" style={{ height: "100%" }}>
                {screen}
              </div>
            </div>

            {/* detail push */}
            {detailTask &&
            <div className="screen-push" style={{ position: "absolute", inset: 0, zIndex: 70 }}>
                <window.TaskDetail task={detailTask} onClose={() => setDetailId(null)}
              onSave={save} onDelete={del} onToggle={toggle} />
              </div>
            }

            <window.AddSheet open={addOpen} onClose={() => setAddOpen(false)} onAdd={add} />
          </div>
        </window.IOSDevice>
      </Stage>

      <window.TweaksPanel>
        <window.TweakSection label="Theme" />
        <window.TweakToggle label="Dark mode" value={t.dark} onChange={(v) => setTweak("dark", v)} />
        <window.TweakColor label="Accent" value={t.accent} onChange={(v) => setTweak("accent", v)} options={[
        ["oklch(0.625 0.142 46)", "oklch(0.555 0.150 40)"],
        ["oklch(0.585 0.165 32)", "oklch(0.515 0.170 28)"],
        ["oklch(0.585 0.105 130)", "oklch(0.515 0.110 128)"],
        ["oklch(0.685 0.130 85)", "oklch(0.605 0.135 82)"],
        ["oklch(0.520 0.115 350)", "oklch(0.460 0.120 348)"]]
        } />
        <window.TweakSection label="Layout & feel" />
        <window.TweakRadio label="Today grouping" value={t.todayLayout}
        options={["heat", "type", "flat"]} onChange={(v) => setTweak("todayLayout", v)} />
        <window.TweakRadio label="Density" value={t.density}
        options={["compact", "regular", "comfy"]} onChange={(v) => setTweak("density", v)} />
        <window.TweakSection label="Typography" />
        <window.TweakSelect label="Pixel font" value={t.font}
        options={["pixelify", "silkscreen", "arcade", "grotesk"]} onChange={(v) => setTweak("font", v)} />
      </window.TweaksPanel>
    </React.Fragment>);

}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);