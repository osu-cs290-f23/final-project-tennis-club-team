import express from 'express';

var router = express.Router();

/* GET home page. */
router.get('/', (req, res, next) => {
  res.status(200).sendFile('./public/homepage.html')
});

export default router;
