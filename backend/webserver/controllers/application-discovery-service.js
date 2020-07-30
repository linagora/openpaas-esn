const ads = require('../../core/application-discovery-service');
const logger = require('../../core/logger');

module.exports = {
  create,
  deleteById,
  getForCurrentUser,
  list,
  listForUser,
  toggleForDomain,
  toggleForPlatform,
  toggleForUser,
  update
};

/**
 * Create an application discovery service.
 * @param {Request} req
 * @param {Response} res
 */
function create(req, res) {
  ads.create({ ...req.body, enabled: true })
    .then(() => res.status(200).json(req.body))
    .catch(sendError(res, 'Failed to create application or service'));
}

/**
 * Delete an application discovery service.
 *
 * @param {Request} req
 * @param {Response} res
 */
function deleteById(req, res) {
  ads.deleteById(req.params.spaId)
    .then(() => res.status(204).end())
    .catch(sendError(res, 'Error while deleting application and service'));
}

/**
 * List applications and services for current user.
 *
 * @param {Request} req
 * @param {Response} res
 */
function getForCurrentUser(req, res) {
  ads.listForUserByType(req.user, req.query.type)
    .then(adsList => res.status(201).json(adsList))
    .catch(sendError(res, 'Error while listing applications and services for current user'));
}

/**
 * List applications and services.
 *
 * @param {Request} req
 * @param {Response} res
 */
function list(req, res) {
  ads.list()
    .then(adsList => res.status(200).json(adsList))
    .catch(sendError(res, 'Error while listing applications and services'));
}

/**
 * List applications and services for specific user.
 *
 * @param {Request} req
 * @param {Response} res
 */
function listForUser(req, res) {
  const user = {
    _id: req.params.userId
  };

  ads.listForUserByType(user, req.query.type)
    .then(adsList => res.status(200).json(adsList))
    .catch(sendError(res, 'Error while listing applications and services for user'));
}

/**
 * Toggle application or service for domain.
 *
 * @param {Request} req
 * @param {Response} res
 */
function toggleForDomain(req, res) {
  const { domainId } = req.params;

  ads.toggleForDomain(domainId, req.body)
    .then(() => res.status(204).end())
    .catch(sendError(res, 'Error while toggling application or service for domain'));
}

/**
 * Toggle application or service for platform.
 *
 * @param {Request} req
 * @param {Response} res
 */
function toggleForPlatform(req, res) {
  ads.toggleForPlatform(req.body)
    .then(() => res.status(204).end())
    .catch(sendError(res, 'Error while toggling application or service for platform'));
}

/**
 * Toggle application or service for user.
 *
 * @param {Request} req
 * @param {Response} res
 */
function toggleForUser(req, res) {
  const { userId } = req.params;
  const user = {
    _id: userId
  };

  ads.toggleForUser(user, req.body)
    .then(() => res.status(204).end())
    .catch(sendError(res, 'Error while toggling application or service for user'));
}

/**
 * Update an application discovery service entry.
 *
 * @param {Request} req
 * @param {Response} res
 */
function update(req, res) {
  ads.update(req.params.spaId, req.body)
    .then(() => res.status(204).end())
    .catch(sendError(res, 'Error while updating application or service'));
}

/**
 * Send an error message.
 *
 * @param {Response} res
 * @param {String} details
 */
function sendError(res, details) {
  return error => {
    logger.error(details, error);

    res.status(500).json({
      error: {
        code: 500,
        message: 'Server Error',
        details
      }
    });
  };
}
