import express from 'express';
import { handleMapClick } from '../services/mapService.js';

const router = express.Router();

router.post('/mapOnClick', mapOnClickController);

export default router;
