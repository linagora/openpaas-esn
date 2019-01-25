const url = require('url');
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

  _search({ objectTypes, term, context, pagination }, req, res);
}

function search(req, res) {
  const context = { user: req.user, domain: req.domain };
  const term = req.query.q || '';
  const pagination = { limit: req.query.limit, offset: 0 };

  _search({ term, context, pagination }, req, res);
}

function _search(options, req, res) {
  peopleService.search(options)
    .then(people => denormalizePeople(req, people))
    .then(people => res.status(200).json(people || []))
    .catch(err => {
      const message = 'Error while searching people';

      logger.error(message, err);
      res.status(500).json({error: {code: 500, message, details: 'Error while searching people'}});
    });
}

function denormalizePeople(req, people) {
  return Promise.all(people.map(person => denormalizePerson(req, person)));
}

function denormalizePerson(req, person) {
  if (person.photos) {
    person.photos.forEach(photo => {
      photo.url = getImageUrl(req, photo.url);
    });
  }

  return Promise.resolve(person);
}

function getImageUrl(req, initialUrl) {
  const base = url.format({
    protocol: req.protocol,
    host: req.get('host')
  });

  return new url.URL(initialUrl, base).href;
}
