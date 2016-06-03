'use strict';

var authorize = require('../middleware/authorization');
var linkMiddleware = require('../middleware/resource-link');
var linkController = require('../controllers/resource-link');

module.exports = function(router) {

  router.post('/resource-links',
    authorize.requiresAPILogin,
    linkMiddleware.isResourceLink,
    linkMiddleware.canCreate,
    linkMiddleware.isLinkable,
    linkController.create);

};
