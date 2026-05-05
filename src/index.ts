import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';


// Routes
import authRoutes from './routes/authRoute';
import adminRoutes from './routes/adminRoute';      // Admin only routes
import userRoutes from './routes/userRoute';        // Regular user routes
import productRoutes from './routes/productRoute';
import orderRoutes from './routes/orderRoute';
import cartRoutes from './routes/cartRoute';        // Don't forget cart!

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;



// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);           // For user profile, cart, etc.
app.use('/api/products', productRoutes);      // Public product routes
app.use('/api/orders', orderRoutes);          // Order management
app.use('/api/admin', adminRoutes);           // Admin only routes
app.use('/api/cart', cartRoutes);             // Shopping cart

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: err })
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API URL: http://localhost:${PORT}/api`);
});