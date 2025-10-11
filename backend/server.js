import express from 'express';
import cors from 'cors';
import mapRoutes from './routes/mapRoutes.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', mapRoutes);

app.get('/', (req, res) => {
  res.send('Hello World!')
})

const port = 3000;
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})


