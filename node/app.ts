import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import cors from 'cors';
import { fileURLToPath } from 'url';
import createError from 'http-errors';
import { setupSwagger } from './swagger-setup.js';

import indexRouter from './routes/index.js';
import usersRouter from './routes/users.js';
import groupRouter from './routes/groups.js';
import groupMemberRouter from './routes/groupMembers.js';
import groupHierarchyRouter from './routes/groupHierarchy.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

// Initialize Swagger documentation
setupSwagger(app);

app.use('/', indexRouter);
app.use('/api/users', usersRouter);
app.use('/api/groups', groupRouter);
app.use('/api/groups', groupMemberRouter);
app.use('/api/groups', groupHierarchyRouter);

// catch 404 and forward to error handler
app.use(function (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  next(createError(404));
});

// error handler
app.use(function (
  err: any,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.json({ error: err.message });
});

export default app;
