import './browser.js';

import cookieParser from 'cookie-parser';
import express from 'express';
import favicon from 'serve-favicon';
import logger from 'morgan';
import path from 'path';

import indexRouter from './routes/index.js';
import toureyRouter from './routes/tour.js';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(favicon(path.join(__dirname, 'public/favicon', 'favicon.ico')))

app.use('/', indexRouter);
app.use('/tournaments', toureyRouter);

app.use(express.static(path.join(__dirname, 'public')));

app.get('*', function(req, res){
    res.status(404).sendFile(__dirname + "/public/404.html")
});

export default app;
