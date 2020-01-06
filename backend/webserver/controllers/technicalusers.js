const logger = require('../../core/logger');
const coreTechnicalUsers = require('../../core/technical-user');
const denormalizeTechnicalUser = require('../../webserver/denormalize/technicaluser');
const { promisify } = require('util');

const DEFAULT_OFFSET = 0;
const DEFAULT_LIMIT = 50;

module.exports = {
  list,
  create,
  update,
  remove
};

function list(req, res) {
  const domainId = req.params.uuid;

  const options = {
    domainId,
    offset: +req.query.offset || DEFAULT_OFFSET,
    limit: +req.query.limit || DEFAULT_LIMIT
  };

  promisify(coreTechnicalUsers.list)(options)
    .then(technicalUsers => res.status(200).json(
      technicalUsers.map(
        technicalUser => denormalizeTechnicalUser.denormalize(technicalUser)
      )))
    .catch(err => {
      const details = 'Error while finding technical users';

      logger.error(details, err);

      return res.status(500).json({
        error: {
          code: 500,
          message: 'Server Error',
          details
        }
      });
    });
}

function create(req, res) {
  const { name, description, type, data } = req.body;

  const technicalUser = {
    name,
    description,
    type,
    domain: req.params.uuid,
    data
  };

  promisify(coreTechnicalUsers.add)(technicalUser)
    .then(technicalUser => res.status(201).json(technicalUser))
    .catch(err => {
      const details = 'Error while creating a technical user';

      logger.error(details, err);

      return res.status(500).json({
        error: {
          code: 500,
          message: 'Server Error',
          details
        }
      });
    });
}

function update(req, res) {
  const { name, description, type, data } = req.body;

  const technicalUser = {
    name,
    description,
    type,
    domain: req.params.uuid,
    data,
    ...req.technicalUser
  };

  promisify(coreTechnicalUsers.update)(req.params.technicalUserId, technicalUser)
    .then(() => res.status(204).end())
    .catch(err => {
      const details = 'Error while updating a technical user';

      logger.error(details, err);

      return res.status(500).json({
        error: {
          code: 500,
          message: 'Server Error',
          details
        }
      });
    });
}

function remove(req, res) {
  const userId = req.params.technicalUserId;

  promisify(coreTechnicalUsers.deleteById)(userId)
    .then(() => res.status(204).end())
    .catch(err => {
      const details = 'Error while removing a technical user';

      logger.error(details, err);

      return res.status(500).json({
        error: {
          code: 500,
          message: 'Server Error',
          details
        }
      });
    });
}
