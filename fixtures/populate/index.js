'use strict';

var q = require('q');
var extend = require('extend');
var mongoose = require('mongoose');
require('../../backend/core/db/mongo/models/domain');
require('../../backend/core/db/mongo/models/community');
require('../../backend/core/db/mongo/models/user');
var Domain = mongoose.model('Domain');
var Community = mongoose.model('Community');
var User = mongoose.model('User');

var ADMIN_OBJECT = {
  firstname: 'admin',
  lastname: 'admin',
  password: 'secret',
  accounts: [{
    type: 'email',
    emails: ['admin@open-paas.org']
  }]
};

var USER_OBJECT = {
  firstname: 'John',
  lastname: 'Doe',
  password: 'secret',
  accounts: [{
    type: 'email',
    emails: ['user@open-paas.org']
  }]
};

var DOMAIN_OBJECT = {
  name: 'OpenPaaS',
  company_name: 'open-paas.org'
};

var COMMUNITY_OBJECT = {
  title: 'OpenPaaS Community',
  description: 'The Open PaaS project aims at developing a PaaS (Platform as a Service) technology ' +
    'dedicated to enterprise collaborative applications deployed on hybrid clouds (private / public). ' +
    'Open PaaS is a platform that allow to design and deploy applications based on proven technologies ' +
    'provided by partners such as collaborative messaging system, integration and workflow technologies ' +
    'that is extended in order to address Cloud Computing requirements.'
};

function _populateAdmin() {
  console.log('[INFO] POPULATE admin');
  var admin = new User(ADMIN_OBJECT);
  var deferred = q.defer();
  admin.save(deferred.makeNodeResolver());
  return deferred.promise;
}

function _populateDomain(admin) {
  console.log('[INFO] POPULATE domain');
  var object = extend({}, DOMAIN_OBJECT);
  object.administrator = admin[0];
  var domain = new Domain(DOMAIN_OBJECT);
  return q.ninvoke(domain, 'save')
    .then(function(domain) {
      return [admin[0], domain[0]];
    }, q.reject);
}

function _joinDomain(user, domain) {
  var deferred = q.defer();
  user.joinDomain(domain, function(err) {
    if (err) { deferred.reject(err); }
    deferred.resolve([user, domain]);
  });
  return deferred.promise;
}

function _buildMember(id) {
  return {
    member: {
      objectType:'user',
      id: id
    },
    status: 'joined'
  };
}

function _populateCommunity(admin, domain) {
  console.log('[INFO] POPULATE community');
  var object = extend({}, COMMUNITY_OBJECT);
  object.creator = admin._id;
  object.domain_ids = [domain._id];
  object.members = [_buildMember(admin._id)];
  var community = new Community(object);
  return q.ninvoke(community, 'save')
    .then(function() {
      return [community, domain];
    });
}

function _createUser(index, community, domain) {
  var userToSave = {
    firstname: USER_OBJECT.firstname + index,
    lastname: USER_OBJECT.lastname + index,
    password: USER_OBJECT.password,
    accounts: [{
      type: USER_OBJECT.accounts[0].type,
      emails: [USER_OBJECT.accounts[0].emails[0].replace(/(\w+)@/, '$1' + index + '@')]
    }]
  };

  var user = new User(userToSave);
  return q.ninvoke(user, 'save')
    .then(function(user) {
      return user[0];
    })
    .then(function(user) {
      return _joinDomain(user, domain)
    })
    .spread(function(user) {
       return q.ninvoke(
          Community, 'update',
          {
            _id: community._id,
            'members.user': {$ne: user._id}
          },
          {
            $push: { members: _buildMember(user._id) }
          });
    });
}

function _populateMembers(community, domain) {
  console.log('[INFO] POPULATE members');
  var createUsers = [];
  for(var i = 0; i < 20; i++) {
    var promise = _createUser(i, community, domain)
    createUsers.push(promise)
  }
  return q.allSettled(createUsers);
}

module.exports = function() {
  console.log('[INFO] POPULATE the ESN');
  return _populateAdmin()
    .then(_populateDomain)
    .spread(_joinDomain)
    .spread(_populateCommunity)
    .spread(_populateMembers)
};
