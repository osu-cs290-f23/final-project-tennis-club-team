import fs from "fs";
import path from "path";
import browserify from "browserify";
import watchify from "watchify";

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicFolder = fs.readdirSync(path.join(__dirname, 'client/public'));
const adminFolder = fs.readdirSync(path.join(__dirname, 'client/admin'));

publicFolder.forEach(async (file) => {
    var b = browserify({
        entries: ['./client/' + file],
        cache: {},
        packageCache: {},
        plugin: [watchify]
    });
    
    const bundle = () => {
        b.bundle()
            .on('error', console.error)
            .pipe(fs.createWriteStream('./public/javascripts/' + file));
    };
    
    b.on('update', bundle);
    b.on('log', console.log);
    
    bundle();

    console.log('Started:', file);
});

adminFolder.forEach(async (file) => {
    var b = browserify({
        entries: ['./client/' + file],
        cache: {},
        packageCache: {},
        plugin: [watchify]
    });
    
    const bundle = () => {
        b.bundle()
            .on('error', console.error)
            .pipe(fs.createWriteStream('./admin/javascripts/' + file));
    };
    
    b.on('update', bundle);
    b.on('log', console.log);
    
    bundle();

    console.log('Started:', file);
});