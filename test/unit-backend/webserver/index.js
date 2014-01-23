'use strict';

var BASEPATH = '../../..';
var expect = require('chai').expect;
var mockery = require('mockery');

describe('The Webserver module', function() {

  it('should exist', function() {
    var webserver = require(BASEPATH + '/backend/webserver');
    expect(webserver).to.exist;
  });

  it('should be an object', function() {
    var webserver = require(BASEPATH + '/backend/webserver');
    expect(webserver).to.be.an.Object;
  });

  it('should have an application property', function() {
    var webserver = require(BASEPATH + '/backend/webserver');
    expect(webserver.application).to.exist;
    expect(webserver.application).to.be.a.Function;
  });

  it('should have a server property', function() {
    var webserver = require(BASEPATH + '/backend/webserver');
    expect(webserver).to.have.property('server');
    expect(webserver.server).to.be.null;
  });

  it('should have a port property', function() {
    var webserver = require(BASEPATH + '/backend/webserver');
    expect(webserver).to.have.property('port');
    expect(webserver.port).to.be.null;
  });

  it('should have a started property', function() {
    var webserver = require(BASEPATH + '/backend/webserver');
    expect(webserver).to.have.property('started');
    expect(webserver.started).to.be.false;
  });

  it('should have a start property', function() {
    var webserver = require(BASEPATH + '/backend/webserver');
    expect(webserver).to.have.property('start');
    expect(webserver.start).to.be.a.Function;
  });

  describe('the start property', function() {
    var port = require(BASEPATH + '/backend/core').config('default').webserver.port;
    it('should start the web server', function(done) {
      var expressMock = function() {
        return {
          listen: function(serverPort) {
            var complete = serverPort === port;
            if (complete) {
              done();
            } else {
              done(new Error('serverPort ' + serverPort + ' is not configuration port ' + port));
            }
            return {on: function() {}};
          },
          use: function() {},
          set: function() {}
        };
      };

      mockery.registerMock('express', expressMock);

      var webserver = require(BASEPATH + '/backend/webserver');

      webserver.start(require(BASEPATH + '/backend/core').config('default').webserver.port);
    });
  });

  describe('the start property', function() {
    it('should fire the callback when the server starts', function(done) {
      var port = require(BASEPATH + '/backend/core').config('default').webserver.port;
      var expressMock = function() {
        return {
          listen: function(serverPort) {
            return {
              on: function(event, callback) {
                if (event === 'listening') {
                  process.nextTick(callback);
                }
              },
              removeListener: function() {}
            };
          },
          use: function() {},
          set: function() {}
        };
      };

      mockery.registerMock('express', expressMock);

      var webserver = require(BASEPATH + '/backend/webserver');

      webserver.start(port, function() {
        done();
      });
    });
  });

  describe('when started', function() {
    it('should set the webserver into the server property', function(done) {
      var port = require(BASEPATH + '/backend/core').config('default').webserver.port;

      var serverInstance = {
        me: true,
        on: function(event, callback) {
          if (event === 'listening') {
            process.nextTick(callback);
          }
        },
        removeListener: function() {}
      };

      var expressMock = function() {
        return {
          listen: function(serverPort) {
            return serverInstance;
          },
          use: function() {},
          set: function() {}
        };
      };
      mockery.registerMock('express', expressMock);
      var webserver = require(BASEPATH + '/backend/webserver');

      webserver.start(port, function() {
        expect(serverInstance === webserver.server).to.be.true;
        done();
      });
    });
  });

  describe('when started', function() {
    it('should set the port property', function(done) {
      var port = require(BASEPATH + '/backend/core').config('default').webserver.port;
      var serverInstance = {
        me: true,
        on: function(event, callback) {
          if (event === 'listening') {
            process.nextTick(callback);
          }
        },
        removeListener: function() {}
      };

      var expressMock = function() {
        return {
          listen: function(serverPort) {
            return serverInstance;
          },
          use: function() {},
          set: function() {}
        };
      };
      mockery.registerMock('express', expressMock);
      var webserver = require(BASEPATH + '/backend/webserver');

      webserver.start(port, function() {
        expect(webserver.port).to.equal(port);
        done();
      });
    });
  });

});
