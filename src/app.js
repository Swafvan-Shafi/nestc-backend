require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

// Import routes
const authRoutes = require('./modules/auth/auth.routes');
const vendingRoutes = require('./modules/vending/vending.routes');
const marketplaceRoutes = require('./modules/marketplace/listing.routes');
const bookingRoutes = require('./modules/bookings/booking.routes');
const chatRoutes = require('./modules/chat/chat.routes');
const uploadRoutes = require('./modules/upload/upload.routes');
const adminRoutes = require('./modules/admin/admin.routes');

// Import jobs
require('./jobs/cleanup');

const app = express();
const server = http.createServer(app);

// FIXED: Increased maxHttpBufferSize to 50MB to allow large Base64 images to be sent via WebSockets
const io = new Server(server, {
  maxHttpBufferSize: 50 * 1024 * 1024, 
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE']
  }
});

const path = require('path');
// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/vending', vendingRoutes);
app.use('/api/v1/marketplace/listings', marketplaceRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/admin', adminRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to NestC API v1.0' });
});

const registerChatHandlers = require('./socket/chat.socket');

// Socket.io
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  registerChatHandlers(io, socket);

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
};

startServer();
