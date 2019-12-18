const q = require('q');
const extend = require('extend');
const mongoose = require('mongoose');
const { promisify } = require('util');

require('../../backend/core/db/mongo/models/domain');
require('../../backend/core/db/mongo/models/community');
require('../../backend/core/db/mongo/models/user');
const Domain = mongoose.model('Domain');
const Community = mongoose.model('Community');
const User = mongoose.model('User');
const userDomainModule = require('../../backend/core/user/domain');
const helpers = require('../../backend/core/db/mongo/plugins/helpers');

helpers.applyPlugins();
helpers.patchFindOneAndUpdate();

const {
  ADMIN,
  USER,
  DOMAIN,
  COMMUNITY
} = require('./data/populate-objects');

module.exports = {
  populateAll,
  provisionDomainAndAdministrator,
  populateDomainConfigurationAndTechnicalUsers
};

function populateDomainConfigurationAndTechnicalUsers(host, [admin, domain]) {
  _log('[INFO] POPULATE Domain configuration and technical user');

  const technicalUsers = require('./data/technical-users');
  const configuration = require('./data/configuration');

  return Promise.all([technicalUsers([domain]), configuration([domain], host)])
    .then(function() {
      return Promise.resolve([admin, domain]);
    });
}

function populateAll(host) {
  _log('[INFO] POPULATE the ESN');

  return _populateAdmin()
    .then(_populateDomain.bind(null, null))
    .then(populateDomainConfigurationAndTechnicalUsers.bind(null, host))
    .then(_joinDomain)
    .then(_populateCommunity)
    .then(_populateMembers);
}

function provisionDomainAndAdministrator(email, password) {
  const parts = email.split('@');
  const login = parts[0];
  const domainName = parts[1];
  const admin = {
    firstname: 'Admin',
    lastname: 'Admin',
    password: password || login,
    accounts: [{
      type: 'email',
      hosted: true,
      emails: [email]
    }]
  };
  const domain = {
    name: domainName,
    company_name: domainName
  };

  return _populateAdmin(admin)
    .then(_populateDomain.bind(null, domain))
    .then(_joinDomain);
}

function _populateAdmin(adminObject) {
  _log('[INFO] POPULATE admin');

  const admin = new User(adminObject || ADMIN);

  return admin.save();
}

function _populateDomain(domainObject, admin) {
  _log('[INFO] POPULATE domain');

  const object = extend({}, domainObject || DOMAIN, { administrators: [{ user_id: admin }] });
  const domain = new Domain(object);

  return domain.save().then(domain => [admin, domain]);
}

function _joinDomain([user, domain]) {
  return promisify(userDomainModule.joinDomain)(user, domain)
    .then(() => [user, domain]);
}

function _buildMember(id) {
  return {
    member: {
      objectType: 'user',
      id: id
    },
    status: 'joined'
  };
}

function _populateCommunity([admin, domain]) {
  _log('[INFO] POPULATE community');

  const community = new Community({
    creator: admin._id,
    domain_ids: [domain._id],
    members: [_buildMember(admin._id)],
    ...COMMUNITY
  });

  return community.save().then(() => [community, domain]);
}

function _createUser(index, community, domain) {
  const userToSave = {
    firstname: USER.firstname + index,
    lastname: USER.lastname + index,
    password: USER.password,
    accounts: [{
      type: USER.accounts[0].type,
      emails: [USER.accounts[0].emails[0].replace(/(\w+)@/, '$1' + index + '@')]
    }]
  };

  const user = new User(userToSave);

  return user.save()
    .then(user => _joinDomain([user, domain]))
    .then(([user]) =>
      Community.update({
        _id: community._id,
        'members.user': {$ne: user._id}
      }, {
        $push: { members: _buildMember(user._id) }
      })
    );
}

function _populateMembers([community, domain]) {
  _log('[INFO] POPULATE members');
  const createUsers = [];

  for (let i = 0; i < 20; i++) {
    createUsers.push(_createUser(i, community, domain));
  }

  return q.allSettled(createUsers);
}

function _log(message) {
  console.log(message); // eslint-disable-line
}
