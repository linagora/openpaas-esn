'use strict';

const Domain = require('mongoose').model('Domain');
const dbHelper = require('../../helpers').db;

/**
 * Load middleware. Load a domain from its UUID and push it into the request (req.domain) for later use.
 *
 * @param {Request} req
 * @param {Response} res
 * @param {Function} next
 */
function load(req, res, next) {
  if (!dbHelper.isValidObjectId(req.params.uuid)) {
    return res.status(400).json({ error: { code: 400, message: 'Bad request', details: 'domainID is not a valid ObjectId' }});
  }

  Domain.loadFromID(req.params.uuid, function(err, domain) {
    if (err) {
      return next(err);
    }
    if (!domain) {
      return res.status(404).end();
    }
    req.domain = domain;

    return next();
  });
}
module.exports.load = load;

function loadFromDomainIdParameter(req, res, next) {
  const id = req.query.domain_id;

  if (!id) {
    return res.status(400).json({ error: { code: 400, message: 'Missing parameter', details: 'The domain_id parameter is mandatory'}});
  }

  if (!dbHelper.isValidObjectId(id)) {
    return res.status(400).json({ error: { code: 400, message: 'Bad Request', details: 'domainID is not a valid ObjectId' }});
  }

  Domain.loadFromID(id, function(err, domain) {
    if (err) {
      return next(err);
    }
    if (!domain) {
      return res.status(404).json({ error: { code: 404, message: 'Not found', details: 'The domain ' + id + ' could not be found'}});
    }
    req.domain = domain;

    return next();
  });
}
module.exports.loadFromDomainIdParameter = loadFromDomainIdParameter;
