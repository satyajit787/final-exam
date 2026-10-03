require('dotenv').config();

const express = require('express');
const connectDB = require('./config/db');
const complaintRoutes = require('./routes/complaintRoutes');

const app = express();

app.use(express.json());
app.use('/api/complaints', complaintRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);

  if (error.name === 'ValidationError' || error.name === 'CastError' || error.status === 400) {
    return res.status(400).json({ success: false, message: error.message });
  }

  console.error(error);
  return res.status(500).json({ success: false, message: 'Internal server error' });
});

async function startServer() {
  await connectDB();
  const port = process.env.PORT || 3000;
  return app.listen(port, () => console.log(`Server listening on port ${port}`));
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Failed to start server:', error.message);
    process.exitCode = 1;
  });
}

module.exports = { app, startServer };