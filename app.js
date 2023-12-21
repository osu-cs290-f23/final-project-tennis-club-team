import './browser.js';

import cookieParser from 'cookie-parser';
import express from 'express';
import favicon from 'serve-favicon';
import logger from 'morgan';
import path from 'path';
import passport from 'passport';
import session from 'express-session';
import connect from 'connect-sqlite3';

import indexRouter from './routes/index.js';
import toureyRouter from './routes/tour.js';
import authRouter from './routes/auth.js';

import { fileURLToPath } from 'url';

import auth from './auth.json' assert { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

var app = express();
var SQLiteStore = connect(session);

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(favicon(path.join(__dirname, 'public/favicon', 'favicon.ico')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'aRand0mS3cret', //imagine we use this in prod
    resave: false,
    saveUninitialized: false,
    store: new SQLiteStore({ db: 'sessions.db', dir: './var/db' })
}));
app.use(passport.authenticate('session'));

app.use('/', indexRouter);
app.use('/', authRouter);
app.use('/tournaments', (req, res, next) => {
    if(req.user?.username !== auth.username) {
        return res.redirect('/login');
    }

    next();
}, toureyRouter);

app.get('*', function(req, res) {
    res.status(404).sendFile(__dirname + "/public/404.html")
});

export default app;
