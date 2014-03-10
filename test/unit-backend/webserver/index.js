'use strict';

var expect = require('chai').expect,
    mockery = require('mockery');

describe('The Webserver module', function() {
  var port = null,
      expressMock = null,
      serverInstance = null;

  it('should contains all needed properties', function() {
    var webserver = require(this.testEnv.basePath + '/backend/webserver');
    expect(webserver).to.exist;
    expect(webserver).to.be.an.Object;
    expect(webserver.application).to.exist;
    expect(webserver.application).to.be.a.Function;
    expect(webserver).to.have.property('server');
    expect(webserver.server).to.be.null;
    expect(webserver).to.have.property('port');
    expect(webserver.port).to.be.null;
    expect(webserver).to.have.property('started');
    expect(webserver.started).to.be.false;
    expect(webserver).to.have.property('start');
    expect(webserver.start).to.be.a.Function;
  });

  before(function() {
    port = require(this.testEnv.basePath + '/backend/core').config('default').webserver.port;
    expressMock = require(this.testEnv.fixtures + '/express').express();
    serverInstance = {
        me: true,
        on: function(event, callback) {
          if (event === 'listening') {
            process.nextTick(callback);
          }
        },
        removeListener: function() {}
      };

  });

  describe('the start property', function() {

    it('should start the web server', function(done) {
      expressMock.constructorResponse.listen = function(serverPort) {
        var complete = serverPort === port;
        if (complete) {
          done();
        } else {
          done(new Error('serverPort ' + serverPort + ' is not configuration port ' + port));
        }
        return {on: function() {}};
      };

      mockery.registerMock('./middleware/setup-sessions', function() {});
      mockery.registerMock('express', expressMock);

      var webserver = require(this.testEnv.basePath + '/backend/webserver');

      webserver.start(port);
    });

    it('should fire the callback when the server starts', function(done) {
      expressMock.constructorResponse.listen = function(serverPort) {
        return serverInstance;
      };

      mockery.registerMock('./middleware/setup-sessions', function() {});
      mockery.registerMock('express', expressMock);

      var webserver = require(this.testEnv.basePath + '/backend/webserver');

      webserver.start(port, function() {
        done();
      });
    });
  });

  describe('when started', function() {

    it('should set the webserver into the server property and set the port property', function(done) {
      expressMock.constructorResponse.listen = function(serverPort) {
        return serverInstance;
      };

      mockery.registerMock('./middleware/setup-sessions', function() {});
      mockery.registerMock('express', expressMock);

      var webserver = require(this.testEnv.basePath + '/backend/webserver');

      webserver.start(port, function() {
        expect(serverInstance === webserver.server).to.be.true;
        expect(webserver.port).to.equal(port);
        done();
      });
    });
  });

});
