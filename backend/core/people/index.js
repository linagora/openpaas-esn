const PeopleService = require('./service');
const PeopleResolver = require('./resolver');
const Person = require('./person');
const service = new PeopleService();

module.exports = {
  service,
  PeopleResolver,
  Person
};
