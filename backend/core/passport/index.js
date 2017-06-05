const passport = require('passport');
const ssoStrategies = require('./sso-strategies');

module.exports = {
  get,
  ssoStrategies
};

function get() {
  return passport;
}
