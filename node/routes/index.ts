import * as express from 'express';
const router = express.Router();

/* Hello World function. */
router.get('/', function(req, res, next) {
  res.json({ title: 'Hello World!' });
});


export default router;
