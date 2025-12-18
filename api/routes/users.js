const express = require('express');
const usersController = require('../controllers/user');
const tokenChecker = require('../middleware/tokenChecker');

const router = express.Router();

router.post('/', usersController.create);              
router.post('/login', usersController.login);           
router.get('/me', tokenChecker, usersController.getUserInfo); 
router.put('/stats', tokenChecker, usersController.update);   
router.delete('/', tokenChecker, usersController.delete);     

module.exports = router;