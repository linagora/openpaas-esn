const emailAddresses = require('email-addresses');
const Checker = require('./checker');

module.exports = {
  email: new Checker('email', emailValidator)
};

function emailValidator(email) {
  return !!emailAddresses.parseOneAddress(email);
}
