'use strict';

const ldap = require('../../core/ldap');
const logger = require('../../core/logger');

function search(req, res) {
  ldap.search(req.user, req.query).then(result => {
    res.header('X-ESN-Items-Count', result.total_count);

    res.status(200).json(result.list);
  }, err => {
    logger.error('Error while searching LDAP: %s', err.message);

    res.status(500).json({error: {code: 500, message: 'Server Error', details: 'Error while searching LDAP'}});
  });
}

module.exports = {
  search
};
