import express from 'express';
import cors from 'cors';
import mapRoutes from './routes/mapRoutes.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', mapRoutes);

app.get('/', (req, res) => {
  res.send('Backend is running');
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Server listening on http://localhost:${PORT}`);
});


