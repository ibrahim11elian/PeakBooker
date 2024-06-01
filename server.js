/*global process*/
import dotenv from 'dotenv';
import mongoose from 'mongoose';

process.on('uncaughtException', shutDownServer);
import { app } from './app.js';

dotenv.config();

// let connString = process.env.DB_STRING;
// const user = process.env.DB_USER;
// const password = process.env.DB_PASSWORD;

// connString = connString.replace('<USER>', user);
// connString = connString.replace('<PASSWORD>', password);

// Connecting to the Database
mongoose.connect(process.env.LOCAL_DB).then(() => {
  console.log('Connected to the Database');
});

// Starting The Server
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`${process.env.NODE_ENV} server is running on port ${port}`);
});

// this will handle any rejection in the entire application
process.on('unhandledRejection', shutDownServer);

function shutDownServer(err) {
  console.log(err.name, err.message);
  console.log('Shutting down...');
  server.close(() => {
    process.exit(1);
  });
}

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});
