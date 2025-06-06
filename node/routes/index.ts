import * as express from 'express';
const router = express.Router();

/* Hello World function. */
router.get('/', function(req, res, next) {
  res.json({ title: 'Hello World!' });
});

/* Health check endpoint for Docker */
router.get('/health', function(req, res, next) {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'simplerqms-api'
  });
});


export default router;
