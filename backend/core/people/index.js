const PeopleService = require('./service');
const PeopleResolver = require('./resolver');
const Person = require('./person');
const service = new PeopleService();

module.exports = {
  service,
  PeopleResolver,
  Person
};

service.addResolver(require('../user/people-resolver'));
service.addResolver(require('../ldap/people-resolver'));
