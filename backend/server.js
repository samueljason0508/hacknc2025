import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import mapRoutes from './routes/mapRoutes.js';

const app = express();
app.use(cors());
app.use(express.json());

//Resolve __dirname in ESM (since it's not built-in here)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//Serve static files from /outputs
app.use('/static', express.static(path.join(__dirname, '../outputs')));

//Endpoint to serve the Voronoi GeoJSON directly
app.get('/api/voronoi', (req, res) => {
  res.sendFile(path.join(__dirname, '../outputs', 'voronoi_conus.geojson'));
});

// Existing routes
app.use('/api', mapRoutes);

// Simple root route
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Start server
const port = 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
