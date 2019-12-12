const mongoose = require('mongoose');
const TechnicalUser = mongoose.model('TechnicalUser');
const authToken = require('../auth/token');

const TYPE = 'technical';

module.exports = {
  TYPE,
  add,
  deleteById,
  findByType,
  findByTypeAndDomain,
  get,
  getNewToken,
  list,
  update
};

function findByType(type, callback) {
  TechnicalUser.find({type: type}, callback);
}

function findByTypeAndDomain(type, domain, callback) {
  TechnicalUser.find({type: type, domain: domain}, callback);
}

function add(technicalUser, callback) {
  if (!(technicalUser instanceof TechnicalUser)) {
    technicalUser = new TechnicalUser(technicalUser);
  }

  return technicalUser.save(callback);
}

function deleteById(id, callback) {
  TechnicalUser.findByIdAndDelete(id, callback);
}

function get(id, callback) {
  TechnicalUser.findOne({_id: id}, callback);
}

function update(id, payload, callback) {
  const { name, description, type, domain, data } = payload;

  TechnicalUser.findByIdAndUpdate(id,
    {
      name,
      description,
      type,
      domain,
      data
    }, callback);
}

function list(options, callback) {
  options = options || {};
  const findOptions = {};

  if (options.domainId) {
    findOptions.domain = options.domainId;
  }

  let query = TechnicalUser.find(findOptions);

  if (options.offset > 0) {
    query = query.skip(+options.offset);
  }

  if (options.limit > 0) {
    query = query.limit(+options.limit);
  }

  return query.exec(callback);
}

function getNewToken(technicalUser, ttl, callback) {
  authToken.getNewToken({ttl: ttl, user: technicalUser._id, user_type: TYPE}, callback);
}
