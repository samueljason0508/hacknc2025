import express from 'express';
import { mapOnClickController } from '../controllers/mapController.js';

const router = express.Router();

router.post('/mapOnClick', mapOnClickController);

export default router;
