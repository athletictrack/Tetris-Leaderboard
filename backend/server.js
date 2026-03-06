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
const REQUEST_DELAY = parseInt(process.env.REQUEST_DELAY_MS) || 1000;
const USER_AGENT = "Mozilla/5.0";
// ==================

// Enable CORS for frontend
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

// Fetch stats for one user
async function fetchOneUser(member) {
  try {
    const baseUrl = `https://ch.tetr.io/api/users/${member.username}`;
    
    // Fetch all modes in parallel
    const [leagueResp, blitzResp, fortyResp, zenithResp] = await Promise.all([
      axios.get(`${baseUrl}/summaries/league`, { headers: { "User-Agent": USER_AGENT }, timeout: 10000 }),
      axios.get(`${baseUrl}/summaries/blitz`, { headers: { "User-Agent": USER_AGENT }, timeout: 10000 }),
      axios.get(`${baseUrl}/summaries/40l`, { headers: { "User-Agent": USER_AGENT }, timeout: 10000 }),
      axios.get(`${baseUrl}/summaries/zenith`, { headers: { "User-Agent": USER_AGENT }, timeout: 10000 }),
    ]);

    const fallback = { tr: 0, pps: 0, apm: 0, vs: 0, letterRank: "-" };

    leaderboardCache[member.username] = {
      realName: member.realName,
      username: member.username,
      // Tetra League
      tr: leagueResp.data.data?.tr || fallback.tr,
      pps: leagueResp.data.data?.pps || fallback.pps,
      apm: leagueResp.data.data?.apm || fallback.apm,
      vs: leagueResp.data.data?.vs || fallback.vs,
      letterRank: leagueResp.data.data?.rank || fallback.letterRank,
      // Other modes
      blitz: blitzResp.data.data?.tr || 0,
      fortyLines: fortyResp.data.data?.tr || 0,
      zenith: zenithResp.data.data?.tr || 0,
      // Standings (from Tetra League)
      standing_world: leagueResp.data.data?.standing || 0,
      standing_local: leagueResp.data.data?.standing_local || 0,
      updated: Date.now(),
    };

    console.log(`Updated ${member.username}`);
  } catch (err) {
    console.warn(`Error updating ${member.username}: ${err.response?.status || err.message}`);
    // Keep member in cache with zeroed stats
    leaderboardCache[member.username] = {
      realName: member.realName,
      username: member.username,
      tr: 0,
      blitz: 0,
      fortyLines: 0,
      zenith: 0,
      pps: 0,
      apm: 0,
      vs: 0,
      letterRank: "-",
      standing_world: 0,
      standing_local: 0,
      updated: Date.now(),
    };
  }
}

// Rotating updater (keeps API calls rate-limited)
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
  // Sort by Tetra League TR by default
  list.sort((a, b) => b.tr - a.tr);
  // Assign clubRank
  list.forEach((member, index) => {
    member.clubRank = index + 1;
  });

  res.json({
    updated: Date.now(),
    totalMembers: members.length,
    cachedMembers: list.length,
    members: list,
  });
});

// Serve frontend
app.use(express.static(path.join(__dirname, "../frontend/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

// Startup
loadMembers();
rotatingUpdater();

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));