import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { handleMapClick } from './api/services/mapService.js';
import aiOnPromptHandler from './api/aiOnPrompt.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from public directory
app.use('/public', express.static(join(__dirname, 'public')));

// API Routes
app.post('/api/mapOnClick', async (req, res) => {
  try {
    const { lat, lng } = req.body;
    
    if (!lat || !lng) {
      return res.status(400).json({
        status: 'error',
        message: 'Latitude and longitude are required'
      });
    }

    const result = await handleMapClick(lat, lng);
    
    res.status(200).json({
      status: 'ok',
      data: result
    });
  } catch (error) {
    console.error('Error in mapOnClick:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// AI prompt endpoint
app.post('/api/aiOnPrompt', async (req, res) => {
  try {
    await aiOnPromptHandler(req, res);
  } catch (error) {
    console.error('Error in aiOnPrompt:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API server is running' });
});

app.listen(PORT, () => {
  console.log(`Development server running on http://localhost:${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api`);
});
