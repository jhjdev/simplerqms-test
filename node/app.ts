import createError from 'http-errors';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import logger from 'morgan';

import indexRouter from './routes/index.js';
import usersRouter from './routes/users.js';
import groupRouter from './routes/groups.js';
import groupMemberRouter from './routes/groupMembers.js';
import groupHierarchyRouter from './routes/groupHierarchy.js';

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors({
  origin: '*', // Allow all origins for development
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.use('/', indexRouter);
app.use('/api/users', usersRouter);
app.use('/api/groups', groupRouter);
app.use('/api/groups', groupMemberRouter);
app.use('/api/groups', groupHierarchyRouter);

// Swagger documentation temporarily disabled
// Uncomment when ESM compatibility issues are resolved

// catch 404 and forward to error handler
app.use(function (req: express.Request, res: express.Response, next: express.NextFunction) {
  next(createError(404));
});

// error handler
app.use(function (err: any, req: express.Request, res: express.Response, next: express.NextFunction) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.json({ error: err.message });
});

export { app };
export default app;
