const PeopleService = require('./service');
const PeopleSearcher = require('./searcher');
const Model = require('./model');
const constants = require('./constants');
const service = new PeopleService();

module.exports = {
  constants,
  service,
  PeopleSearcher,
  Model
};

service.addSearcher(require('../user/people-searcher'));
service.addSearcher(require('../ldap/people-searcher'));
