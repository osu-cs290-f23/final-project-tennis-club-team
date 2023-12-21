import express from 'express';
import path from 'path';
import passport from 'passport';
import LocalStrategy from 'passport-local';

import { fileURLToPath } from 'url';

import auth from '../auth.json' assert { type: 'json' };

var router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

passport.use(new LocalStrategy(function verify(username, password, cb) {
    if(username === auth.username && password === auth.password) {
        return cb(null, { username: username });
    } else {
        return cb(null, false, { message: 'Incorrect username or password.' });
    }
}));

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
        cb(null, { username: user.username });
    });
});

passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
        return cb(null, user);
    });
});

router.get('/login', function(req, res) {
    res.status(200).sendFile(path.resolve(__dirname, '../public/login.html'));
});

router.post('/login', passport.authenticate('local', { 
    successRedirect: '/', 
    failureRedirect: '/login', 
    failureMessage: true 
}));

router.post('/logout', function(req, res, next) {
    req.logout(function(err) {
        if (err) { 
            return next(err); 
        }

        res.redirect('/');
    });
});

export default router;