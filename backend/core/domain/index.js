'use strict';

const mongoose = require('mongoose');
const Domain = mongoose.model('Domain');
const pubsub = require('../pubsub').local;
const { Event } = require('../models');
const { OBJECT_TYPE, EVENTS } = require('./constants');

module.exports = {
  create,
  update,
  getByName,
  getByHostname,
  getDomainAdministrators,
  load,
  list,
  listByCursor,
  removeById,
  updateById,
  userIsDomainAdministrator,
  userIsDomainMember
};

function create(domain, callback) {
  const domainAsModel = domain instanceof Domain ? domain : new Domain(domain);

  domainAsModel.save((err, response) => {
    if (!err && response) {
      pubsub.topic(EVENTS.CREATED).publish(new Event(null, EVENTS.CREATED, OBJECT_TYPE, String(response._id), response));
    }

    callback(err, response);
  });
}

function update(modifiedDomain, callback) {
  Domain.findOneAndUpdate({_id: modifiedDomain.id}, modifiedDomain, { new: true }, (err, updatedDomain) => {
    if (!err && updatedDomain) {
      pubsub.topic(EVENTS.UPDATED).publish(new Event(null, EVENTS.CREATED, OBJECT_TYPE, String(updatedDomain._id), updatedDomain));
    }

    callback(err, updatedDomain);
  });
}

/**
  * Update domain by ID
  *
  * @param {string} domainId   - The ID of domain
  * @param {object} modified   - The object contains attributes with new values
  * @param {function} callback - The callback that handles the updated domain
  */
function updateById(domainId, modified, callback) {
  const options = { new: true }; // http://mongoosejs.com/docs/api.html#query_Query-findOneAndUpdate

  return Domain.findOneAndUpdate({ _id: domainId }, { $set: modified }, options, callback);
}

function removeById(domainId, callback) {
  return Domain.deleteOne({ _id: domainId }, callback);
}

function getByName(name) {
  return Domain.findOne({ name });
}

/**
 * Get domain that have hostname in domain.hostnames array
 * @param  {String} hostname - The hostname to get domain
 * @return {Promise}         - Resolve the found domain
 */
function getByHostname(hostname) {
  return Domain.findOne({ hostnames: hostname });
}

function getDomainAdministrators(domain) {
  var administrators = domain.administrators ? domain.administrators.slice() : [];
  var oldAdministrator = domain.administrator;

  if (oldAdministrator) {
    var alreadyAdded = administrators.some(function(administrator) {
      return oldAdministrator.equals(administrator.user_id);
    });

    if (!alreadyAdded) {
      administrators.push({
        user_id: oldAdministrator,
        timestamps: { creation: domain.timestamps.creation }
      });
    }
  }

  return administrators;
}

function list(options, callback) {
  options = options || {};
  const findOptions = {};

  if (options.hostname) {
    findOptions.hostnames = options.hostname;
  }
  if (options.name) {
    findOptions.name = options.name;
  }
  let domainQuery = Domain.find(findOptions);

  if (options.offset > 0) {
    domainQuery = domainQuery.skip(+options.offset);
  }

  if (options.limit > 0) {
    domainQuery = domainQuery.limit(+options.limit);
  }
  domainQuery.sort('-timestamps.creation').exec(callback);
}

function listByCursor(options = {}) {
  return Domain.find(options).cursor();
}

function load(id, callback) {
  if (!id) {
    return callback(new Error('Domain id is required'));
  }

  return Domain.findOne({_id: id}, callback);
}

function userIsDomainAdministrator(user, domain, callback) {
  if (!user || !user._id) {
    return callback(new Error('User object is required'));
  }

  if (!domain || !domain._id) {
    return callback(new Error('Domain object is required'));
  }

  var isDomainAdministrator = getDomainAdministrators(domain).some(function(administrator) {
    return administrator.user_id.equals(user._id);
  });

  return callback(null, isDomainAdministrator);
}

function userIsDomainMember(user, domain, callback) {
  if (!user || !user._id) {
    return callback(new Error('User object is required'));
  }

  if (!domain || !domain._id) {
    return callback(new Error('Domain object is required'));
  }

  userIsDomainAdministrator(user, domain, function(err, isAdmin) {
    if (err) {
      return callback(err);
    }

    if (isAdmin) {
      return callback(null, true);
    }

    if (!user.domains || user.domains.length === 0) {
      return callback(null, false);
    }

    var belongs = user.domains.some(function(userdomain) {
      return userdomain.domain_id && userdomain.domain_id.equals(domain._id);
    });

    if (!belongs) {
      return callback(null, false);
    }

    return callback(null, true);
  });
}
