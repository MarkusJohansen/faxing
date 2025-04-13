import express from 'express';
import cors from 'cors';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { promises as fs } from 'fs';

const app = express();
const port = process.env.PORT || 3001;

const __dirname = dirname(fileURLToPath(import.meta.url));
const PARTICIPANTS_FILE = join(__dirname, 'participants.json');
const RESULTS_DIR = join(__dirname, '..', 'results');
const GAMES_FILE = join(__dirname, 'games.json');

app.use(cors());
app.use(express.json());

// Load participants from file
async function loadParticipants() {
  try {
    const data = await fs.readFile(PARTICIPANTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading participants:', error);
    return [];
  }
}

// Save participants to file
async function saveParticipants(participants) {
  try {
    await fs.writeFile(PARTICIPANTS_FILE, JSON.stringify(participants, null, 2));
  } catch (error) {
    console.error('Error saving participants:', error);
  }
}

// Load games from file
async function loadGames() {
  try {
    const data = await fs.readFile(GAMES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, create it with empty games object
      await fs.writeFile(GAMES_FILE, JSON.stringify({}, null, 2));
      return {};
    }
    console.error('Error loading games:', error);
    return {};
  }
}

// Save games to file
async function saveGames(games) {
  try {
    // Ensure the directory exists
    await fs.mkdir(dirname(GAMES_FILE), { recursive: true });
    await fs.writeFile(GAMES_FILE, JSON.stringify(games, null, 2));
  } catch (error) {
    console.error('Error saving games:', error);
  }
}

// Save final leaderboard state
async function saveFinalLeaderboard(participants) {
  try {
    const now = new Date();
    const timestamp = now.toISOString()
      .replace(/:/g, '-')  // Replace colons with dashes for filename compatibility
      .replace(/\..+/, ''); // Remove milliseconds
    
    const filename = `faxing-results-${timestamp}.json`;
    const filePath = join(RESULTS_DIR, filename);
    
    const resultData = {
      timestamp: now.toISOString(),
      participants: participants.sort((a, b) => a.time - b.time),
      metadata: {
        totalParticipants: participants.length,
        winner: participants.length > 0 ? participants.sort((a, b) => a.time - b.time)[0] : null,
        gameEndTime: now.toISOString()
      }
    };

    await fs.writeFile(filePath, JSON.stringify(resultData, null, 2));
    console.log(`Saved final leaderboard to ${filePath}`);
    return filename;
  } catch (error) {
    console.error('Error saving final leaderboard:', error);
    throw error;
  }
}

let participants = [];
let games = {};

// Load initial data
Promise.all([
  loadParticipants().then(data => { participants = data; }),
  loadGames().then(data => { games = data; })
]).catch(error => {
  console.error('Error loading initial data:', error);
});

// Generate a unique game ID
function generateGameId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

app.post('/api/games/create', async (req, res) => {
  try {
    const gameId = generateGameId();
    games[gameId] = {
      id: gameId,
      players: [],
      isStarted: false,
      createdAt: new Date().toISOString()
    };
    await saveGames(games);
    console.log(`Created new game with ID: ${gameId}`);
    res.json({ gameId });
  } catch (error) {
    console.error('Error creating game:', error);
    res.status(500).json({ error: 'Failed to create game' });
  }
});

app.get('/api/games/:gameId/players', (req, res) => {
  const { gameId } = req.params;
  const game = games[gameId];
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }
  res.json(game.players);
});

app.post('/api/games/join', async (req, res) => {
  const { gameId, playerName } = req.body;
  const game = games[gameId];
  
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }
  
  if (game.isStarted) {
    return res.status(400).json({ error: 'Game has already started' });
  }
  
  if (game.players.some(p => p.name.toLowerCase() === playerName.toLowerCase())) {
    return res.status(400).json({ error: 'Player name already taken' });
  }
  
  game.players.push({ name: playerName });
  await saveGames(games);
  res.json({ success: true });
});

app.post('/api/games/:gameId/start', async (req, res) => {
  const { gameId } = req.params;
  const game = games[gameId];
  
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }
  
  if (game.isStarted) {
    return res.status(400).json({ error: 'Game has already started' });
  }
  
  game.isStarted = true;
  await saveGames(games);
  res.json({ success: true });
});

app.get('/api/participants', (req, res) => {
  res.json(participants.sort((a, b) => a.time - b.time));
});

app.post('/api/participants', async (req, res) => {
  const { name, time } = req.body;
  participants.push({ name, time });
  await saveParticipants(participants);
  res.json(participants.sort((a, b) => a.time - b.time));
});

app.post('/api/reset', async (req, res) => {
  if (participants.length > 0) {
    try {
      const filename = await saveFinalLeaderboard(participants);
      console.log(`Final leaderboard saved to: ${filename}`);
    } catch (error) {
      console.error('Error saving final leaderboard:', error);
    }
  }
  
  participants = [];
  games = {};
  
  try {
    await Promise.all([
      saveParticipants(participants),
      saveGames(games)
    ]);
    res.json({ message: 'Game reset successfully' });
  } catch (error) {
    console.error('Error during reset:', error);
    res.status(500).json({ error: 'Failed to reset game' });
  }
});

app.post('/api/game-over', async (req, res) => {
  if (participants.length > 0) {
    try {
      const filename = await saveFinalLeaderboard(participants);
      res.json({ message: 'Final leaderboard saved', filename });
    } catch (error) {
      console.error('Error saving final leaderboard:', error);
      res.status(500).json({ error: 'Failed to save final leaderboard' });
    }
  } else {
    res.json({ message: 'No participants to save' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 