import express from 'express';
import cors from 'cors';
import receiptRoutes from './routes/receipt.routes';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.use('/api/receipts', receiptRoutes);

app.listen(PORT, () => {
  console.log(`Simulated server running at http://localhost:${PORT}`);
});
