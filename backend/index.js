import express from 'express';
import cors from 'cors';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json());

const PARTICIPANTS_FILE = join(__dirname, 'participants.json');
const RESULTS_DIR = join(__dirname, '..', 'results');

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

// Load initial participants
loadParticipants().then(data => {
  participants = data;
}).catch(error => {
  console.error('Error loading initial participants:', error);
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
  await saveParticipants(participants);
  res.json({ message: 'Game reset successfully' });
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

const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 