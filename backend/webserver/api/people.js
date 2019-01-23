const authorize = require('../middleware/authorization');
const peopleController = require('../controllers/people');

module.exports = router => {

  router.get('/people/search', authorize.requiresAPILogin, peopleController.search);
  router.post('/people/search', authorize.requiresAPILogin, peopleController.advancedSearch);

};
