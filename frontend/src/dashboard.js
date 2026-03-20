import React, { useState } from "react";
import Leaderboard from "./Leaderboard";
import Profile from "./Profile"; // placeholder for future tab

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("leaderboard");

  return (
    <div style={{ padding: "20px" }}>
      {/* Tabs */}
      <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
        <button
          onClick={() => setActiveTab("leaderboard")}
          style={{ fontWeight: activeTab === "leaderboard" ? "bold" : "normal" }}
        >
          Leaderboard
        </button>
        <button
          onClick={() => setActiveTab("profile")}
          style={{ fontWeight: activeTab === "profile" ? "bold" : "normal" }}
        >
          Profile
        </button>
      </div>

      {/* Tab content */}
      {activeTab === "leaderboard" && <Leaderboard />}
      {activeTab === "profile" && <Profile />}
    </div>
  );
}