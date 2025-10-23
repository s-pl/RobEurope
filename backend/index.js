import express from 'express';
import apiRoutes from './routes/api/dbhealt.api.js'
// import userRoutes from './routes/userRoutes.js';

const app = express();
const PORT = process.env.PORT || 3000;


app.use(express.json());
app.use('/', apiRoutes);



app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

