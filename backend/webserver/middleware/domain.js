'use strict';

var Domain = require('mongoose').model('Domain');

/**
 * Load middleware. Load a domain from its UUID and push it into the request (req.domain) for later use.
 *
 * @param {Request} req
 * @param {Response} res
 * @param {Function} next
 */
function load(req, res, next) {
  Domain.loadFromID(req.params.uuid, function(err, domain) {
    if (err) {
      return next(err);
    }
    if (!domain) {
      return res.send(404);
    }
    req.domain = domain;
    return next();
  });
}
module.exports.load = load;

function loadFromDomainIdParameter(req, res, next) {
  var id = req.query.domain_id;
  if (!id) {
    return res.json(400, { error: { code: 400, message: 'Missing parameter', details: 'The domain_id parameter is mandatory'}});
  }

  Domain.loadFromID(id, function(err, domain) {
    if (err) {
      return next(err);
    }
    if (!domain) {
      return res.json(404, { error: { code: 404, message: 'Not found', details: 'The domain ' + id + ' could not be found'}});
    }
    req.domain = domain;
    return next();
  });
}
module.exports.loadFromDomainIdParameter = loadFromDomainIdParameter;
