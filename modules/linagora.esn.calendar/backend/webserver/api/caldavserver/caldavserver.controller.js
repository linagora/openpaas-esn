'use strict';

var caldavserver;

function getCaldavUrl(req, res) {
  caldavserver.getCaldavServerUrlForClient(function(err, url) {
    if (err) {
      return res.json(500, {error: {code: 500, message: 'Get CalDAV server url failed', details: err.message}});
    }
    res.json(200, {url: url});
  });
}

module.exports = function(dependencies) {
  caldavserver = require('./caldavserver.core')(dependencies);
  return {
    getCaldavUrl: getCaldavUrl
  };
};
