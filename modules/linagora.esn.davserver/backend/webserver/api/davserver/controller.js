'use strict';

var davserver;

function getDavUrl(req, res) {
  davserver.getDavServerUrlForClient(function(err, url) {
    if (err) {
      return res.json(500, {error: {code: 500, message: 'Get DAV server url failed', details: err.message}});
    }
    res.json(200, {url: url});
  });
}

module.exports = function(dependencies) {
  davserver = require('./core')(dependencies);

  return {
    getDavUrl: getDavUrl
  };
};
