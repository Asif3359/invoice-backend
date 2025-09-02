require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const { connectDB } = require('./config/database');

const app = express();

// CORS configuration for Android app
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:8081', // React Native default
    'http://localhost:19006', // Expo default
    'http://10.0.2.2:3000',  // Android emulator localhost
    'http://10.0.3.2:3000',  // Genymotion emulator localhost
    'http://192.168.1.100:3000', // Your local network IP
    'http://192.168.1.101:3000'  // Alternative local network IP
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Initialize app function
const initializeApp = async () => {
  try {
    // Connect to database first
    await connectDB();
    console.log('✅ Database connected successfully');
    
    // Only load routes after database is connected
    const indexRouter = require('./routes/index');
    
    // Routes (serve before static files)
    app.use('/', indexRouter);
    
    // Static files (serve after routes)
    app.use(express.static(path.join(__dirname, 'public')));
    
    console.log('✅ Routes loaded successfully');
    
  } catch (error) {
    console.error('❌ Failed to initialize app:', error);
    process.exit(1);
  }
};

// Initialize the app
initializeApp();

module.exports = app;
