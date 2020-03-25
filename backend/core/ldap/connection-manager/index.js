const LdapAuth = require('ldapauth-fork');
const CachedConnectionManager = require('./CachedConnectionManager');

module.exports = new CachedConnectionManager(LdapAuth);
