import React, { useEffect, useState } from "react";

export default function Leaderboard() {
  const [members, setMembers] = useState([]);
  const [darkMode, setDarkMode] = useState(false); // start light so we control it immediately

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
    applyMode(true); // force dark mode immediately on mount
    setDarkMode(true);

    const fetchData = async () => {
      try {
        const res = await fetch("http://localhost:3001/api/leaderboard");
        const data = await res.json();
        setMembers(data.members);
      } catch (err) {
        console.error("Failed to fetch leaderboard:", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const toggleDarkMode = () => {
    applyMode(!darkMode);
    setDarkMode(!darkMode);
  };

  return (
    <div>
      {/* Toggle button in top-right corner */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "10px" }}>
        <label style={{ display: "inline-flex", alignItems: "center", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={darkMode}
            onChange={toggleDarkMode}
            style={{ marginRight: "8px" }}
          />
          {darkMode ? "Dark Mode" : "Dark Mode"}
        </label>
      </div>

      <h1>UTS Tetris Elite Leaderboard</h1>
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Real Name</th>
            <th>Username</th>
            <th>TR</th>
            <th>PPS</th>
            <th>APM</th>
            <th>VS</th>
            <th>Local Standing</th> {/* swapped */}
            <th>World Standing</th> {/* swapped */}
          </tr>
        </thead>
        <tbody>
          {members.map((m, i) => (
            <tr key={m.username}>
              <td>{i + 1}</td>
              <td>{m.realName}</td>
              <td>
                <a
                  href={`https://ch.tetr.io/u/${m.username}/league`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {m.username}
                </a>
              </td>
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
        <footer>Last updated: {new Date(members[0].updated).toLocaleTimeString()}</footer>
      )}
    </div>
  );
}