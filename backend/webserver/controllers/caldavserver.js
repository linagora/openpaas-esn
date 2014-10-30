'use strict';

var caldav = require('../../core/caldav');

function getCaldavUrl(req, res) {
  caldav.getCaldavServerUrlForClient(function(err, url) {
    if (err) {
      return res.json(500, {error: {code: 500, message: 'Get CalDAV server url failed', details: err}});
    }
    res.json(200, {url: url});
  });
}
module.exports.getCaldavUrl = getCaldavUrl;
