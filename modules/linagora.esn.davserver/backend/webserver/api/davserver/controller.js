'use strict';

var davserver;

function getDavUrl(req, res) {
  davserver.getDavServerUrlForClient(function(err, url) {
    if (err) {
      return res.status(500).json({error: {code: 500, message: 'Get DAV server url failed', details: err.message}});
    }
    res.status(200).json({url: url});
  });
}

module.exports = function(dependencies) {
  davserver = require('./core')(dependencies);

  return {
    getDavUrl: getDavUrl
  };
};
