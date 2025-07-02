import express, { ErrorRequestHandler } from 'express';
import cors from 'cors';
import { checkJwt } from './middleware/auth0'; // Import the JWT checker
import { attachUser } from './middleware/user'; // Import the user attacher
import { errorHandler } from './middleware/errorHandler';
import apiRoutes from './routes';
import config from './config';
import path from 'path';

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// --- The New, Robust Authentication Flow ---
// For any route under /api, first validate the JWT, then attach the user from our DB.
app.use('/api', checkJwt, attachUser, apiRoutes);


// This section is for serving your React frontend
app.use(express.static(config.frontendBuildPath));
app.get('/*foo', (req, res) => {
  res.sendFile(path.join(config.frontendBuildPath, 'index.html'));
});

app.use(errorHandler as ErrorRequestHandler);

export default app;
