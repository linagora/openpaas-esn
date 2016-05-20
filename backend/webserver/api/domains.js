'use strict';

var authorize = require('../middleware/authorization');
var domains = require('../controllers/domains');
var domainMiddleware = require('../middleware/domain');

module.exports = function(router) {
  router.post('/domains', domains.createDomain);
  router.get('/domains/:uuid', authorize.requiresAPILogin, domainMiddleware.load, authorize.requiresDomainMember, domains.getDomain);
  router.get('/domains/:uuid/members', authorize.requiresAPILogin, domainMiddleware.load, authorize.requiresDomainMember, domains.getMembers);
  router.post('/domains/:uuid/invitations', authorize.requiresAPILogin, domainMiddleware.load, authorize.requiresDomainMember, domains.sendInvitations);
  router.get('/domains/:uuid/manager', authorize.requiresAPILogin, domainMiddleware.load, authorize.requiresDomainManager, domains.getDomain);
};
