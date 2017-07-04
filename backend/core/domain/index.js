'use strict';

var mongoose = require('mongoose');
var Domain = mongoose.model('Domain');

module.exports = {
  create,
  getByName,
  getDomainAdministrators,
  load,
  list,
  userIsDomainAdministrator,
  userIsDomainMember
};

function create(domain, callback) {
  const domainAsModel = domain instanceof Domain ? domain : new Domain(domain);

  return domainAsModel.save((err, response) => callback(err, response));// Because save function's callback will receive three parameters
                                                                        // http://mongoosejs.com/docs/api.html#model_Model-save
}

function getByName(name) {
  return Domain.findOne({ name });
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
  var domainQuery = Domain.find();

  if (options.offset > 0) {
    domainQuery = domainQuery.skip(+options.offset);
  }

  if (options.limit > 0) {
    domainQuery = domainQuery.limit(+options.limit);
  }
  domainQuery.sort('-timestamps.creation').exec(callback);
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
