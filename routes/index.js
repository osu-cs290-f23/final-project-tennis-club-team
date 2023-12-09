import express from 'express';
import path from 'path';

import { fileURLToPath } from 'url';

var router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* GET home page. */
router.get('/', (req, res, next) => {
  res.status(200).sendFile(path.join(__dirname, '../public/homepage.html'))
});

export default router;
