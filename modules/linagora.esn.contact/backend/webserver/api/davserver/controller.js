'use strict';

var davserver;

function getDavUrl(req, res) {
  davserver.getClientDavUrl(function(err, url) {
    if (err) {
      return res.json(500, { error: { code: 500, message: 'Get DAV server url failed', details: err } });
    }
    res.json(200, { url: url });
  });
}

module.exports = function(dependencies) {
  davserver = require('./core')(dependencies);
  return {
    getDavUrl: getDavUrl
  };
};
