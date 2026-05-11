const express = require('express');
const matchController = require('../controllers/matchController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All match routes require authentication
router.use(authenticate);

router.get('/', matchController.getAllMatches);
router.get('/:id', matchController.getMatchById);
router.post('/', matchController.createMatch);
router.put('/:id', matchController.updateMatch);
router.delete('/:id', matchController.deleteMatch);

module.exports = router;