const express = require("express");
const cors = require("cors");
const fs = require("fs");
const axios = require("axios");
const path = require("path");

const app = express();

// ===== CONFIG =====
const PORT = process.env.PORT || 5000;
const MEMBERS_FILE = path.join(__dirname, "members.json");
const REQUEST_DELAY = parseInt(process.env.REQUEST_DELAY_MS) || 2000; // 2 seconds
const USER_AGENT = "Mozilla/5.0";
const FRONTEND_URL = process.env.FRONTEND_URL || "*"; // allow all origins by default
// ==================

// Enable CORS
app.use(cors({ origin: FRONTEND_URL }));

let members = [];
let leaderboardCache = {};
let currentIndex = 0;

// Serve Vite frontend build
app.use(express.static(path.join(__dirname, "../frontend/dist")));

// Catch-all route to serve frontend
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

// Load members from JSON
function loadMembers() {
  try {
    const raw = fs.readFileSync(MEMBERS_FILE, "utf-8");
    members = JSON.parse(raw);
    console.log(`Loaded ${members.length} members`);
  } catch (err) {
    console.error("Failed to load members.json:", err.message);
    members = [];
  }
}

// Fetch one member's stats
async function fetchOneUser(member) {
  try {
    const url = `https://ch.tetr.io/api/users/${member.username}/summaries/league`;
    const response = await axios.get(url, {
      headers: { "User-Agent": USER_AGENT },
      timeout: 10000,
    });

    if (!response.data.success || !response.data.data) {
      console.warn(`User not found or private: ${member.username}`);
      leaderboardCache[member.username] = {
        realName: member.realName,
        username: member.username,
        tr: 0,
        pps: 0,
        apm: 0,
        vs: 0,
        rank: "-",
        standing_world: 0,
        standing_local: 0,
        updated: Date.now(),
      };
      return;
    }

    const data = response.data.data;

    leaderboardCache[member.username] = {
      realName: member.realName,
      username: member.username,
      tr: data.tr || 0,
      pps: data.pps || 0,
      apm: data.apm || 0,
      vs: data.vs || 0,
      rank: data.rank || "-",
      standing_world: data.standing || 0,
      standing_local: data.standing_local || 0,
      updated: Date.now(),
    };

    console.log(`Updated ${member.username}`);
  } catch (err) {
    console.log(`Error updating ${member.username}: ${err.response?.status || err.message}`);
  }
}

// Rotating updater: one member at a time
async function rotatingUpdater() {
  if (members.length === 0) return;

  const member = members[currentIndex];
  await fetchOneUser(member);

  currentIndex = (currentIndex + 1) % members.length;
  setTimeout(rotatingUpdater, REQUEST_DELAY);
}

// API endpoint
app.get("/api/leaderboard", (req, res) => {
  const list = Object.values(leaderboardCache);
  list.sort((a, b) => b.tr - a.tr);

  res.json({
    updated: Date.now(),
    totalMembers: members.length,
    cachedMembers: list.length,
    members: list,
  });
});

// Optional homepage
app.get("/status", (req, res) => {
  res.send("UTS Tetris Club backend is running. Go to /api/leaderboard for JSON data.");
});

// ===== STARTUP =====
loadMembers();
rotatingUpdater();

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));