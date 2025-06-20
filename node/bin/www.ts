#!/usr/bin/env node

/**
 * Module dependencies.
 */

import app from '../app.js';
import https from 'https';
import fs from 'fs';

/**
 * Get port from environment and store in Express.
 */

const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

/**
 * Create HTTPS server.
 */

const httpsOptions = {
  key: fs.readFileSync('/app/ssl/key.pem'),
  cert: fs.readFileSync('/app/ssl/cert.pem'),
  requestCert: false,
  rejectUnauthorized: false,
};
const server = https.createServer(httpsOptions, app);

/**
 * Listen on provided port, on all network interfaces.
 */

if (typeof port === 'string' && isNaN(Number(port))) {
  // Named pipe
  server.listen(port, () => {
    console.log(`Server listening on pipe ${port}`);
  });
} else {
  // Port number
  server.listen(Number(port), '0.0.0.0', () => {
    console.log(`Server listening on port ${port}`);
  });
}
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val: string): number | string | boolean {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error: NodeJS.ErrnoException): void {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening(): void {
  const addr = server.address();
  const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr?.port;
  console.log('Listening on ' + bind);
}
