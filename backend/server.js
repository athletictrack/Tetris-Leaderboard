// backend/server.js
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const axios = require("axios");
const path = require("path");

const app = express();

// ===== CONFIG =====
const PORT = process.env.PORT || 3001;
const MEMBERS_FILE = path.join(__dirname, "members.json");
const REQUEST_DELAY = parseInt(process.env.REQUEST_DELAY_MS) || 2000;
const USER_AGENT = "Mozilla/5.0";
// ==================

// Enable CORS for any frontend
app.use(cors({ origin: "*" }));

let members = [];
let leaderboardCache = {};
let currentIndex = 0;

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

// Fetch one member
async function fetchOneUser(member) {
  try {
    const url = `https://ch.tetr.io/api/users/${member.username}/summaries/league`;
    const response = await axios.get(url, {
      headers: { "User-Agent": USER_AGENT },
      timeout: 10000,
    });

    if (!response.data.success || !response.data.data) {
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
      console.warn(`User not found or private: ${member.username}`);
      return;
    }

    const data = response.data.data;

    leaderboardCache[member.username] = {
      realName: member.realName,
      username: member.username,
      clubRank: data.rank || 0, 
      letterRank: data.letterrank || "-",
      tr: data.tr || 0,
      pps: data.pps || 0,
      apm: data.apm || 0,
      vs: data.vs || 0,
      standing_world: data.standing || 0,
      standing_local: data.standing_local || 0,
      updated: Date.now(),
    };

    console.log(`Updated ${member.username}`);
  } catch (err) {
    console.log(`Error updating ${member.username}: ${err.response?.status || err.message}`);
  }
}

// Rotating updater
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

// ===== Serve frontend =====
app.use(express.static(path.join(__dirname, "../frontend/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

// ===== STARTUP =====
loadMembers();
rotatingUpdater();

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));