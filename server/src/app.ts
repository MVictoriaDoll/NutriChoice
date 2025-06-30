import express from 'express';
import cors from 'cors';
import { authenticateUser } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import apiRoutes from './routes'
import config from './config';
import path from 'path';

const app = express();

app.use(cors({
  origin: '*', // Allow all origins for development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Allowed HTTP methods
  allowedHeaders: ['Content-Type', 'X-User-Id'], // X-User-Id for anonymous user handling
}));

app.use(express.json());
app.use(express.urlencoded({extended: true}))

app.use('/api/receipts', apiRoutes);
app.use('/api', authenticateUser);
app.use('/api', apiRoutes);

//app.use(express.static(config.frontendBuildPath));
//app.get('/*foo', (req, res) => {
  //res.sendFile(path.join(config.frontendBuildPath, 'index.html'));
//});

app.use(errorHandler);

export default app;