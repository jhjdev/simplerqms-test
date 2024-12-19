import * as express from 'express';
const indexRouter = express.Router();

/* Hello World function. */
indexRouter.get('/', function(req, res, next) {
  res.json({ title: 'Hello World!' });
});


export default indexRouter;
