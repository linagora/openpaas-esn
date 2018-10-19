'use strict';

const q = require('q');
const emailAddresses = require('email-addresses');
const Domain = require('mongoose').model('Domain');
const dbHelper = require('../../helpers').db;
const userIndex = require('../../core/user/index');
const coreDomain = require('../../core/domain');
const logger = require('../../core/logger');
const authorize = require('../middleware/authorization');

module.exports = {
  canGetMembers,
  load,
  loadFromDomainIdParameter,
  loadDomainByHostname,
  loadSessionDomain,
  requireAdministrator,
  requireDomainInfo,
  checkUpdateParameters
};

/**
 * Load domain by hostname of request
 * @param  {Request}   req
 * @param  {Response}  res
 * @param  {Function}  next
 */
function loadDomainByHostname(req, res, next) {
  const hostname = req.hostname;

  coreDomain.getByHostname(hostname)
    .then(domain => {
      if (domain) {
        req.domain = domain;
        next();
      } else {
        res.status(404).json({
          error: {
            code: 404,
            message: 'Not Found',
            details: `No domain found for hostname: ${hostname}`
          }
        });
      }
    },
    err => {
      const details = `Error while getting domain by hostname ${hostname}`;

      logger.error(details, err);

      res.status(500).json({
        error: {
          code: 500,
          message: 'Server Error',
          details
        }
      });
    });
}

/**
 * Load middleware. Load a domain from its UUID and push it into the request (req.domain) for later use.
 *
 * @param {Request} req
 * @param {Response} res
 * @param {Function} next
 */
function load(req, res, next) {
  if (!dbHelper.isValidObjectId(req.params.uuid)) {
    return res.status(400).json({ error: { code: 400, message: 'Bad request', details: 'Invalid domain id' }});
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

function loadFromDomainIdParameter(req, res, next) {
  const id = req.query.domain_id;

  if (!id) {
    return res.status(400).json({ error: { code: 400, message: 'Missing parameter', details: 'The domain_id parameter is mandatory'}});
  }

  if (!dbHelper.isValidObjectId(id)) {
    return res.status(400).json({ error: { code: 400, message: 'Bad Request', details: 'Invalid domain_id parameter' }});
  }

  loadDomain(id)(req, res, next);
}

/**
 * Require an domain information middleware.
 *
 * @param {Request} req
 * @param {Response} res
 * @param {Function} next
 */
function requireDomainInfo(req, res, next) {
  let details;

  if (!req.body.name) {
    details = 'Domain does not have name';
  } else if (!req.body.company_name) {
    details = 'Domain does not have company name';
  }

  if (details) {
    return res.status(400).json({
      error: {
        code: 400,
        message: 'Bad Request',
        details
      }
    });
  }

  if (req.body.hostnames) {
    if (!Array.isArray(req.body.hostnames)) {
      return res.status(400).json({
        error: {
          code: 400,
          message: 'Bad Request',
          details: 'Hostnames must be an array!'
        }
      });
    }

    return ensureNoConflictHostname(req, res, next);
  }

  next();
}

/**
 * Load preferred domain of the authenticated user
 * @param {Request} req
 * @param {Response} res
 * @param {Function} next
 */
function loadSessionDomain(req, res, next) {
  const domainId = req.user.preferredDomainId;

  if (!domainId) {
    return res.status(404).json({
      error: {
        code: 404,
        message: 'Not Found',
        details: 'You do not belong to any domain'
      }
    });
  }

  loadDomain(domainId)(req, res, next);
}

function loadDomain(domainId) {
  return (req, res, next) => {
    Domain.loadFromID(domainId, function(err, domain) {
      if (err) {
        return next(err);
      }

      if (!domain) {
        return res.status(404).json({
          error: {
            code: 404,
            message: 'Not found',
            details: `The domain ${domainId} could not be found`}
          });
      }

      req.domain = domain;

      return next();
    });
  };
}

/**
 * Require an administrator with well-formed middleware.
 *
 * @param {Request} req
 * @param {Response} res
 * @param {Function} next
 */
function requireAdministrator(req, res, next) {
  const administrator = req.body.administrator;
  let error, details;

  if (!administrator) {
    details = 'An administrator is required';
  } else if (!administrator.email) {
    details = 'Administrator does not have any email address';
  } else if (!administrator.password) {
    details = 'Administrator does not have password';
  } else if (!_isValidEmail(administrator.email)) {
    details = 'Administrator email is not valid';
  }

  if (details) {
    error = {
      code: 400,
      message: 'Bad Request',
      details
    };

    return res.status(error.code).json({ error });
  }

  return userIndex.findByEmail(administrator.email, (err, user) => {
    if (err) {
      return next(err);
    }

    if (user) {
      details = 'Administrator email is already used';
      error = {
        code: 409,
        message: 'Conflict',
        details
      };

      return res.status(error.code).json({ error });
    }

    next();
  });
}

/**
 * Middleware checks parameters for update domain API.
 *
 * @param {Request} req
 * @param {Response} res
 * @param {Function} next
 */
function checkUpdateParameters(req, res, next) {
  if (!req.body.company_name && !req.body.hostnames) {
    return res.status(400).json({
      error: {
        code: 400,
        message: 'Bad Request',
        details: 'Company name or hostnames are required'
      }
    });
  }

  if (req.body.hostnames) {
    if (!Array.isArray(req.body.hostnames)) {
      return res.status(400).json({
        error: {
          code: 400,
          message: 'Bad Request',
          details: 'Hostnames must be an array!'
        }
      });
    }

    return ensureNoConflictHostname(req, res, next);
  }

  return next();
}

function ensureNoConflictHostname(req, res, next) {
  const hostnames = req.body.hostnames;

  q.all(hostnames.map(hostname => coreDomain.getByHostname(hostname)))
    .then(domains => {
      const isUsedByOtherDomain = domains.findIndex(domain => domain && String(domain._id) !== req.params.uuid);

      if (isUsedByOtherDomain !== -1) {
        return res.status(409).json({
          error: {
            code: 409,
            message: 'Conflict',
            details: `Hostname ${hostnames[isUsedByOtherDomain]} is already in use`
          }
        });
      }

      return next();
    })
    .catch(err => {
      logger.error('Unable to verify hostnames', err);

      return res.status(500).json({
        error: {
          code: 500,
          message: 'Server Error',
          details: 'Unable to verify hostnames'
        }
      });
    });
}

function canGetMembers(req, res, next) {
  if (req.query.includesDisabledSearchable === 'true' || req.query.ignoreMembersCanBeSearchedConfiguration === 'true') {
    return authorize.requiresDomainManager(req, res, next);
  }

  return authorize.requiresDomainMember(req, res, next);
}

function _isValidEmail(email) {
  return emailAddresses.parseOneAddress(email) !== null;
}
