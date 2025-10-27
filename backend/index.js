// we will use express to manage our routes
import express from 'express';
import getCompetitionsRouter from './routes/getCompetitions.router.js';

const app = express();

// mount the competitions router under /api
app.use('/api', getCompetitionsRouter);

app.listen(30000, () => {
  console.log('Server is running on port 30000');
});

export default app;

