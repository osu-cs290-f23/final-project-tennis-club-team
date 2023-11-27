import './browser.js';

import cookieParser from 'cookie-parser';
import express from 'express';
import logger from 'morgan';
import path from 'path';

import indexRouter from './routes/index.js';
import toureyRouter from './routes/tour.js';
import usersRouter from './routes/users.js';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/tournaments', toureyRouter);

export default app;
