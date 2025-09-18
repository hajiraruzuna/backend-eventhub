const express = require("express");
const fs = require("fs").promises;
const path = require("path");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const DATA_DIR = path.join(__dirname, "data");
const EVENTS_FILE = path.join(DATA_DIR, "events.json");

// Ensure events.json exists
async function ensureDataFile() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
      await fs.access(EVENTS_FILE);
    } catch {
      await fs.writeFile(EVENTS_FILE, JSON.stringify([], null, 2));
    }
  } catch (err) {
    console.error("Error ensuring data file:", err);
  }
}

// Read events.json
async function readEvents() {
  const data = await fs.readFile(EVENTS_FILE, "utf8");
  return JSON.parse(data);
}

// Write events.json
async function writeEvents(events) {
  await fs.writeFile(EVENTS_FILE, JSON.stringify(events, null, 2));
}

// POST /api/events
app.post("/api/events", async (req, res) => {
  const { title, description, date, location, maxAttendees } = req.body;

  if (!title || !date || !location || !maxAttendees) {
    return res.status(400).json({ error: "title, date, location, maxAttendees are required" });
  }

  if (!Number.isInteger(maxAttendees) || maxAttendees <= 0) {
    return res.status(400).json({ error: "maxAttendees must be a positive integer" });
  }

  const events = await readEvents();

  const newEvent = {
    eventId: "EVT-" + Date.now(),
    title,
    description: description || "",
    date,
    location,
    maxAttendees,
    currentAttendees: 0,
    status: "upcoming"
  };

  events.push(newEvent);
  await writeEvents(events);

  res.status(201).json(newEvent);
});

// GET /api/events
app.get("/api/events", async (req, res) => {
  const events = await readEvents();
  res.json(events);
});

// Root route
app.get("/", (req, res) => {
  res.send("EventHub API is running 🚀");
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  await ensureDataFile();
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
