import express from 'express';
import { getGeolocation } from '../controllers/infoController.js';

const router = express.Router();

router.get('/geolocation', async (req, res) => {
  try {
    const data = await getGeolocation();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
