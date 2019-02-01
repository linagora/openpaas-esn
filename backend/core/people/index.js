const PeopleService = require('./service');
const PeopleResolver = require('./resolver');
const Model = require('./model');
const service = new PeopleService();

module.exports = {
  service,
  PeopleResolver,
  Model
};

service.addResolver(require('../user/people-resolver'));
service.addResolver(require('../ldap/people-resolver'));
