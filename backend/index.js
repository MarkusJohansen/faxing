import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataFile = path.join(__dirname, 'participants.json');

const app = express();
const port = process.env.PORT || 8081;

app.use(cors());
app.use(express.json());

// Load participants from file or initialize empty array
let participants = [];
try {
  if (fs.existsSync(dataFile)) {
    const data = fs.readFileSync(dataFile, 'utf8');
    participants = JSON.parse(data);
  }
} catch (error) {
  console.error('Error reading participants file:', error);
}

// Save participants to file
const saveParticipants = () => {
  try {
    fs.writeFileSync(dataFile, JSON.stringify(participants), 'utf8');
  } catch (error) {
    console.error('Error saving participants:', error);
  }
};

app.get('/api/participants', (req, res) => {
  res.json(participants);
});

app.post('/api/participants', (req, res) => {
  const { name, time } = req.body;
  participants.push({ name, time });
  participants.sort((a, b) => a.time - b.time);
  saveParticipants();
  res.json(participants);
});

// Reset endpoint
app.post('/api/reset', (req, res) => {
  participants = [];
  saveParticipants();
  res.json({ success: true, message: 'Game reset successfully' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 