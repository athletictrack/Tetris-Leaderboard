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
const BATCH_SIZE = 5; // safe batch size for initial fetch
// ==================

// Enable CORS
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

// Fetch one member (all modes)
async function fetchOneUser(member) {
  try {
    const baseUrl = `https://ch.tetr.io/api/users/${member.username}`;

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
      tr: leagueResp.data.data?.tr || fallback.tr,
      pps: leagueResp.data.data?.pps || fallback.pps,
      apm: leagueResp.data.data?.apm || fallback.apm,
      vs: leagueResp.data.data?.vs || fallback.vs,
      letterRank: leagueResp.data.data?.rank || fallback.letterRank,
      blitz: blitzResp.data.data?.tr || 0,
      fortyLines: fortyResp.data.data?.tr || 0,
      zenith: zenithResp.data.data?.tr || 0,
      standing_world: leagueResp.data.data?.standing || 0,
      standing_local: leagueResp.data.data?.standing_local || 0,
      updated: Date.now(),
    };
    console.log(`Updated ${member.username}`);
  } catch (err) {
    console.warn(`Error updating ${member.username}: ${err.response?.status || err.message}`);
    leaderboardCache[member.username] = {
      realName: member.realName,
      username: member.username,
      tr: 0, blitz: 0, fortyLines: 0, zenith: 0,
      pps: 0, apm: 0, vs: 0, letterRank: "-",
      standing_world: 0, standing_local: 0,
      updated: Date.now(),
    };
  }
}

// Initial fetch in batches
async function fetchInitialBatch() {
  for (let i = 0; i < members.length; i += BATCH_SIZE) {
    const batch = members.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(fetchOneUser));
    // short delay between batches to avoid hitting Tetr.io too hard
    await new Promise(res => setTimeout(res, 500));
  }
  console.log("Initial leaderboard cache populated.");
}

// Rotating updater (sequential)
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
  // Sort by selected TR by default
  list.sort((a, b) => b.tr - a.tr);
  list.forEach((member, index) => member.clubRank = index + 1);

  // last updated = most recent updated timestamp among all members
  const lastUpdated = Math.max(...list.map(m => m.updated));

  res.json({
    updated: lastUpdated,
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
fetchInitialBatch().then(() => {
  rotatingUpdater(); // start sequential refresh after initial load
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));2