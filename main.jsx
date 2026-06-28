// main.jsx — Vite entry point.
//
// Vite + the React plugin compile these files for us. The files still share
// their components through the global `window` registry (e.g. window.TaskRow,
// window.computeHeat), so the ORDER below matters: a file must be imported
// after anything it relies on.
import "./styles/ori.css";

import "./frames/tweaks-panel.jsx";
import "./components/pixel-icons.jsx";
import "./data/model.jsx";
import "./components/ui.jsx";
import "./screens/today.jsx";
import "./screens/calendar.jsx";
import "./screens/deadlines.jsx";
import "./screens/detail.jsx";
import "./screens/addtask.jsx";
import "./screens/you.jsx";
import "./app.jsx"; // app.jsx mounts the React app at the bottom of the file
