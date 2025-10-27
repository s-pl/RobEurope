import express from 'express'; 
const router = express.Router();

router.get('/competitions', (req, res) => {
 
  res.json({ message: 'List of competitions' });
});

export default router;
