// frontend/src/main.jsx
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

// Rank images
const RANK_IMAGE_MAP = {
  d: "/ranks/d.png", dplus: "/ranks/dplus.png", cminus: "/ranks/cminus.png",
  c: "/ranks/c.png", cplus: "/ranks/cplus.png", bminus: "/ranks/bminus.png",
  b: "/ranks/b.png", bplus: "/ranks/bplus.png", aminus: "/ranks/aminus.png",
  a: "/ranks/a.png", aplus: "/ranks/aplus.png", sminus: "/ranks/sminus.png",
  s: "/ranks/s.png", splus: "/ranks/splus.png", ss: "/ranks/ss.png",
  u: "/ranks/u.png", x: "/ranks/x.png", xplus: "/ranks/xplus.png",
  z: "/ranks/z.png", unranked: "/ranks/placeholder.png"
};
const DEFAULT_RANK_IMAGE = "/ranks/placeholder.png";
function getRankImage(rank) {
  if (!rank) return DEFAULT_RANK_IMAGE;
  const key = rank.toLowerCase().replace(/\+/g, "plus").replace(/-/g, "minus");
  return RANK_IMAGE_MAP[key] || DEFAULT_RANK_IMAGE;
}

// Header label for modes
const MODE_HEADER_LABEL = {
  tr: "TR",
  blitz: "Blitz Rating",
  fortyLines: "40L Rating",
  zenith: "Zenith Rating"
};

function App() {
  const [members, setMembers] = useState([]);
  const [darkMode, setDarkMode] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMode, setSelectedMode] = useState("tr");

  // Apply dark/light mode
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
    const interval = setInterval(fetchData, 5000); // faster refresh for last updated
    return () => clearInterval(interval);
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
    applyMode(!darkMode);
  };

  const filteredMembers = members.filter(m =>
    m.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.realName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // last updated timestamp
  const lastUpdated = members.length > 0 ? Math.max(...members.map(m => m.updated)) : Date.now();

  return (
    <div style={{ background: "var(--bg-color)", color: "var(--text-color)", minHeight: "100vh", padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "10px" }}>
        <label style={{ display: "inline-flex", alignItems: "center", cursor: "pointer" }}>
          <input type="checkbox" checked={darkMode} onChange={toggleDarkMode} style={{ marginRight: "8px" }} />
          {darkMode ? "Dark Mode" : "Light Mode"}
        </label>
      </div>

      <h1>UTS Tetris Elite Leaderboard</h1>

      <div style={{ marginBottom: "15px" }}>
        <input
          type="text"
          placeholder="Search by username or real name..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{
            padding: "8px", width: "100%", maxWidth: "300px", borderRadius: "6px",
            border: "1px solid var(--table-border)", background: "var(--table-row-even)", color: "var(--text-color)"
          }}
        />
      </div>

      {/* Mode buttons */}
      <div style={{ marginBottom: "15px", display: "flex", gap: "8px" }}>
        {Object.keys(MODE_HEADER_LABEL).map(mode => (
          <button
            key={mode}
            onClick={() => setSelectedMode(mode)}
            style={{
              padding: "6px 12px",
              backgroundColor: selectedMode === mode ? "#4ea3ff" : "var(--table-header-bg)",
              color: selectedMode === mode ? "#fff" : "var(--text-color)",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            {MODE_HEADER_LABEL[mode]}
          </button>
        ))}
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead style={{ background: "var(--table-header-bg)" }}>
          <tr>
            <th>Club Rank</th>
            <th>Real Name</th>
            <th>Username</th>
            <th>Letter Rank</th>
            <th>{MODE_HEADER_LABEL[selectedMode]}</th>
            <th>PPS</th>
            <th>APM</th>
            <th>VS</th>
            <th>Local Standing</th>
            <th>World Standing</th>
          </tr>
        </thead>
        <tbody>
          {filteredMembers.map((m, i) => {
            const trueRank = members.findIndex(x => x.username === m.username) + 1;
            return (
              <tr key={m.username} style={{ background: i % 2 === 0 ? "var(--table-row-even)" : "var(--table-row-odd)" }}>
                <td>{trueRank}</td>
                <td>{m.realName}</td>
                <td>
                  <a href={`https://ch.tetr.io/u/${m.username}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--link-color)" }}>
                    {m.username}
                  </a>
                </td>
                <td>
                  <img src={getRankImage(m.letterRank)} alt={m.letterRank || "Unranked"} height="32" style={{ display: "block", margin: "0 auto", objectFit: "contain" }} />
                </td>
                <td>{m[selectedMode]}</td>
                <td>{m.pps}</td>
                <td>{m.apm}</td>
                <td>{m.vs}</td>
                <td>{m.standing_local}</td>
                <td>{m.standing_world}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {members.length > 0 && (
        <footer style={{ marginTop: "20px", color: "var(--footer-color)" }}>
          Last updated: {new Date(lastUpdated).toLocaleTimeString()}
        </footer>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode><App /></React.StrictMode>
);