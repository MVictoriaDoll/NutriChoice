import express, { ErrorRequestHandler } from 'express';
import cors from 'cors';
// import { authenticateUser } from './middleware/auth';
import { checkJwt } from './middleware/auth0';
import { errorHandler } from './middleware/errorHandler';
import apiRoutes from './routes';
import healthRoutes from './routes/health.routes';
import receiptRoutes from './routes/receipt.routes';
import config from './config';
import path from 'path';

const app = express();

app.use(cors({
  origin: '*', // Allow all origins for development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/api/health', checkJwt, healthRoutes);


app.use('/api/receipts', checkJwt, receiptRoutes);
//app.use('/api/receipts', receiptRoutes);



app.use('/api', apiRoutes);

app.use(express.static(config.frontendBuildPath));
app.get('/*foo', (req, res) => {
  res.sendFile(path.join(config.frontendBuildPath, 'index.html'));
});

app.use(errorHandler as ErrorRequestHandler);

export default app;
