const peopleService = require('../../core/people').service;
const logger = require('../../core/logger');

module.exports = {
  advancedSearch,
  search
};

function advancedSearch(req, res) {
  const context = { user: req.user, domain: req.domain };
  const term = req.body.q || '';
  const objectTypes = req.body.objectTypes || [];
  const pagination = { limit: req.body.limit || req.query.limit, offset: 0 };

  _search({ objectTypes, term, context, pagination }, res);
}

function search(req, res) {
  const context = { user: req.user, domain: req.domain };
  const term = req.query.q || '';
  const pagination = { limit: req.query.limit, offset: 0 };

  _search({ term, context, pagination }, res);
}

function _search(options, res) {
  peopleService.search(options)
    .then(people => res.status(200).json(people || []))
    .catch(err => {
      const message = 'Error while searching people';

      logger.error(message, err);
      res.status(500).json({error: {code: 500, message, details: 'Error while searching people'}});
    });
}
