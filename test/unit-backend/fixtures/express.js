'use strict';

var http = require('http');
var https = require('https');

exports.express = function() {
  function expressMock() {
    return expressMock.constructorResponse;
  }
  expressMock.logger = function() {};
  expressMock.static = function() {};
  expressMock.bodyParser = function() {};
  expressMock.json = function() {};
  expressMock.urlencoded = function() {};
  expressMock.cookieParser = function() {};
  expressMock.session = function() {};
  expressMock.constructorResponse = {
    locals: {},
    all: function() {},
    listen: function() {},
    use: function() {},
    set: function() {},
    get: function() {},
    post: function() {},
    put: function() {},
    delete: function() {},
    copy: function() {}
  };

  return expressMock;
};

exports.http = function() {
  var mockHttp = {
    serverInstance: {
      listen: function() {},
      close: function() {},
      maxHeadersCount: 0,
      setTimeout: function() {},
      timeout: 120000
    },

    Agent: http.Agent,
    Server: http.Server,
    ClientResponse: http.ClientResponse,
    IncomingMessage: http.IncomingMessage,
    createServer: function(app) {
      return mockHttp.serverInstance;
    }
  };

  return mockHttp;
};

exports.https = function() {
  var mockHttps = {
    serverInstance: {
      listen: function() {},
      close: function() {}
    },

    Agent: https.Agent,
    Server: https.Server,
    createServer: function(options, app) {
      return mockHttps.serverInstance;
    }
  };

  return mockHttps;
};
