const authorize = require('../middleware/authorization');
const domain = require('../middleware/domain');
const peopleController = require('../controllers/people');

module.exports = router => {

  router.get('/people/search', authorize.requiresAPILogin, domain.loadSessionDomain, peopleController.search);
  router.post('/people/search', authorize.requiresAPILogin, domain.loadSessionDomain, peopleController.advancedSearch);

};
