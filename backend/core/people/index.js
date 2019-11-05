const PeopleService = require('./service');
const PeopleSearcher = require('./searcher');
const PeopleResolver = require('./resolver');
const Model = require('./model');
const constants = require('./constants');
const service = new PeopleService();

module.exports = {
  constants,
  service,
  Model,
  PeopleResolver,
  PeopleSearcher
};

service.addSearcher(require('../user/people/searcher'));
service.addSearcher(require('../ldap/people-searcher'));
service.addResolver(require('../user/people/resolver'));
