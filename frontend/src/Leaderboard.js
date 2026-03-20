import React, { useEffect, useState } from "react";

export default function Leaderboard() {
  const [members, setMembers] = useState([]);
  const [prevRanks, setPrevRanks] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://localhost:3001/api/leaderboard");
        const data = await res.json();

        // compute rank changes
        const updatedMembers = data.members.map((m, i) => {
          const prev = prevRanks.find(p => p.username === m.username);
          const change = prev ? prev.rank - (i + 1) : 0; // positive = moved up
          return { ...m, change };
        });

        setMembers(updatedMembers);
        setPrevRanks(data.members.map((m, i) => ({ username: m.username, rank: i + 1 })));
      } catch (err) {
        console.error("Failed to fetch leaderboard:", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [prevRanks]);

  return (
    <div>
      <h1>UTS Tetris Elite Leaderboard</h1>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Real Name</th>
            <th>Username</th>
            <th>TR</th>
            <th>World Standing</th>
            <th>Change</th>
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
                  style={{ color: "#4ea3ff" }}
                >
                  {m.username}
                </a>
              </td>
              <td>{m.tr}</td>
              <td>{m.standing_world}</td>
              <td>
                {m.change > 0 ? (
                  <span style={{ color: "green" }}>↑{m.change}</span>
                ) : m.change < 0 ? (
                  <span style={{ color: "red" }}>↓{Math.abs(m.change)}</span>
                ) : (
                  "-"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}