import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import mapRoutes from './routes/mapRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api', mapRoutes);

// Route for /map to serve map.html
app.get('/map', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/map.html'));
});

app.get('/', (req, res) => {
  res.send('Hello World!')
})

const port = 3000;
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})


