// frontend/src/main.jsx
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import "./index.css"; // your global styles

function App() {
  const [members, setMembers] = useState([]);
  const [darkMode, setDarkMode] = useState(true); // start dark

  // Apply dark mode styles
  const applyMode = (dark) => {
    const root = document.documentElement;
    if (dark) {
      root.style.setProperty("--bg-color", "#121212");
      root.style.setProperty("--text-color", "#e0e0e0");
      root.style.setProperty("--table-header-bg", "#1f1f1f");
      root.style.setProperty("--table-row-even", "#1a1a1a");
      root.style.setProperty("--table-row-odd", "#222");
      root.style.setProperty("--table-border", "#444");
      root.style.setProperty("--link-color", "#4ea3ff");
      root.style.setProperty("--row-hover", "#333");
      root.style.setProperty("--footer-color", "#888");
    } else {
      root.style.setProperty("--bg-color", "#ffffff");
      root.style.setProperty("--text-color", "#121212");
      root.style.setProperty("--table-header-bg", "#f0f0f0");
      root.style.setProperty("--table-row-even", "#fafafa");
      root.style.setProperty("--table-row-odd", "#ffffff");
      root.style.setProperty("--table-border", "#ccc");
      root.style.setProperty("--link-color", "#1a73e8");
      root.style.setProperty("--row-hover", "#e0e0e0");
      root.style.setProperty("--footer-color", "#555");
    }
  };

  useEffect(() => {
    applyMode(darkMode);

    const fetchData = async () => {
      try {
        const res = await fetch("/api/leaderboard");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setMembers(data.members);
      } catch (err) {
        console.error("Failed to fetch leaderboard:", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
    applyMode(!darkMode);
  };

  return (
    <div style={{ background: "var(--bg-color)", color: "var(--text-color)", minHeight: "100vh", padding: "20px" }}>
      {/* Dark mode toggle */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "10px" }}>
        <label style={{ display: "inline-flex", alignItems: "center", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={darkMode}
            onChange={toggleDarkMode}
            style={{ marginRight: "8px" }}
          />
          {darkMode ? "Dark Mode" : "Light Mode"}
        </label>
      </div>

      <h1>UTS Tetris Club Leaderboard</h1>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead style={{ background: "var(--table-header-bg)" }}>
          <tr>
            <th>Rank</th>
            <th>Real Name</th>
            <th>Username</th>
            <th>Letter Rank</th>
            <th>TR</th>
            <th>PPS</th>
            <th>APM</th>
            <th>VS</th>
            <th>Local Standing</th>
            <th>World Standing</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m, i) => (
            <tr key={m.username} style={{ background: i % 2 === 0 ? "var(--table-row-even)" : "var(--table-row-odd)" }}>
              <td>{i + 1}</td>
              <td>{m.realName}</td>
              <td>
                <a
                  href={`https://ch.tetr.io/u/${m.username}/league`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "var(--link-color)" }}
                >
                  {m.username}
                </a>
              </td>
              <td>{""}</td>
              <td>{m.tr}</td>
              <td>{m.pps}</td>
              <td>{m.apm}</td>
              <td>{m.vs}</td>
              <td>{m.standing_local}</td>
              <td>{m.standing_world}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {members.length > 0 && (
        <footer style={{ marginTop: "20px", color: "var(--footer-color)" }}>
          Last updated: {new Date(members[0].updated).toLocaleTimeString()}
        </footer>
      )}
    </div>
  );
}

// Render app
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);