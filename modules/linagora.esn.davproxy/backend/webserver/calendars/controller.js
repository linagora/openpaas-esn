'use strict';

var client = require('../proxy/http-client');
var PATH = 'calendars';

module.exports = function(dependencies) {

  var logger = dependencies('logger');

  function getURL(req) {
    return req.davserver + '/' + PATH + req.url;
  }

  function getEventsList(req, res) {
    var headers = req.headers || {};
    headers.ESNToken = req.token && req.token.token ? req.token.token : '';

    client({method: 'POST', headers: headers, body: req.body, url: getURL(req), json: true}, function(err, response, body) {
      if (err) {
        logger.error('Error while getting events from DAV', err);
        return res.json(500, {error: {code: 500, message: 'Server Error', details: 'Error while getting events from DAV server'}});
      }
      return res.json(response.statusCode, body);
    });
  }

  return {
    getEventsList: getEventsList
  };

};
