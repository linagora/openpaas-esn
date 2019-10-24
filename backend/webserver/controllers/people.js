const url = require('url');
const peopleService = require('../../core/people').service;
const logger = require('../../core/logger');
const esnConfig = require('../../core/esn-config');

const getFallbackWebUrl = req => url.format({ protocol: req.protocol, host: req.get('host') });
const buildImageUrl = (base, photoUrl) => new url.URL(photoUrl, base).href;

module.exports = {
  advancedSearch,
  resolve,
  search
};

function advancedSearch(req, res) {
  const context = { user: req.user, domain: req.domain };
  const term = req.body.q || '';
  const objectTypes = req.body.objectTypes || [];
  const pagination = { limit: req.body.limit || req.query.limit, offset: req.body.offset || req.query.offset };
  const excludes = req.body.excludes || [];

  return _search({ objectTypes, term, context, pagination, excludes }, req, res);
}

function search(req, res) {
  const context = { user: req.user, domain: req.domain };
  const term = req.query.q || '';
  const pagination = { limit: req.query.limit, offset: req.query.offset };

  return _search({ term, context, pagination }, req, res);
}

function _search(options, req, res) {
  return peopleService.search(options)
    .then(people => denormalizePeople(req, people))
    .then(people => res.status(200).json(people || []))
    .catch(err => {
      const details = 'Error while searching people';

      logger.error(details, err);
      res.status(500).json({error: {code: 500, message: 'Server Error', details}});
    });
}

function resolve(req, res) {
  const context = { user: req.user, domain: req.domain };
  const fieldType = req.params.fieldType;
  const value = req.params.value;
  const objectTypes = req.query.objectTypes && req.query.objectTypes
    .split(',')
    .map(type => type.trim().toLowerCase()) || [];

  return peopleService.resolve({ objectTypes, fieldType, value, context })
    .then(person => denormalizePerson(req, person))
    .then(person => res.status(200).json(person))
    .catch(err => {
      const details = 'Error while resolving people';

      logger.error(details, err);
      res.status(500).json({error: {code: 500, message: 'Server Error', details}});
    });
}

function denormalizePeople(req, people) {
  return Promise.all(people.map(person => denormalizePerson(req, person)));
}

function denormalizePerson(req, person) {
  return getBaseImageUrl(req, req.user).then(baseUrl => {
    (person && person.photos || []).forEach(photo => {
      photo.url = buildImageUrl(baseUrl, photo.url);
    });

    return person;
  });
}

function getBaseImageUrl(req, user) {
  return esnConfig('web').inModule('core').forUser(user).get()
    .then(webConfig => (webConfig && webConfig.base_url ? webConfig.base_url : getFallbackWebUrl(req)))
    .catch(() => Promise.resolve(getFallbackWebUrl(req)));
}
