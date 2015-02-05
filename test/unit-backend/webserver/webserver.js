'use strict';

var expect = require('chai').expect,
    mockery = require('mockery');

describe('The Webserver module', function() {
  var config = null,
      expressMock = null,
      httpMock = null,
      httpsMock = null,
      serverInstance = null,
      sslserverInstance = null,
      server6Instance = null,
      sslserver6Instance = null;

  function mockServer(basePath) {
    httpMock.serverInstance.listen = function(serverPort, serverIp) {
      if (serverIp === '127.0.0.1') {
        returnData.serverHttpPort = serverPort;
        return serverInstance;
      } else {
        returnData.serverHttpPort6 = serverPort;
        return server6Instance;
      }
    };
    httpsMock.serverInstance.listen = function(serverPort, serverIp) {
      if (serverIp === '127.0.0.1') {
        returnData.serverHttpsPort = serverPort;
        return sslserverInstance;
      } else {
        returnData.serverHttpsPort6 = serverPort;
        return sslserver6Instance;
      }
    };

    mockery.registerMock('./middleware/setup-sessions', function() {});
    mockery.registerMock('http', httpMock);
    mockery.registerMock('https', httpsMock);
    mockery.registerMock('express', expressMock);

    var webserver = require(basePath + '/backend/webserver').webserver;

    var returnData = {
      webserver: webserver,
      serverHttpPort: undefined,
      serverHttpsPort: undefined,
      serverHttpPort6: undefined,
      serverHttpsPort6: undefined
    };
    return returnData;
  }

  it('should contains all needed properties', function() {
    var webserver = this.helpers.requireBackend('webserver').webserver;
    expect(webserver).to.exist;
    expect(webserver).to.be.an.Object;
    expect(webserver.application).to.exist;
    expect(webserver.application).to.be.a.Function;
    expect(webserver.virtualhosts).to.exist;
    expect(webserver.virtualhosts).to.be.an.Array;

    expect(webserver).to.have.property('server');
    expect(webserver.server).to.be.null;
    expect(webserver).to.have.property('server6');
    expect(webserver.server6).to.be.null;
    expect(webserver).to.have.property('sslserver');
    expect(webserver.sslserver).to.be.null;
    expect(webserver).to.have.property('sslserver6');
    expect(webserver.sslserver6).to.be.null;

    expect(webserver).to.have.property('ip');
    expect(webserver.ip).to.be.null;
    expect(webserver).to.have.property('ipv6');
    expect(webserver.ipv6).to.be.null;
    expect(webserver).to.have.property('port');
    expect(webserver.port).to.be.null;

    expect(webserver).to.have.property('ssl_ip');
    expect(webserver.ssl_ip).to.be.null;
    expect(webserver).to.have.property('ssl_ipv6');
    expect(webserver.ssl_ipv6).to.be.null;
    expect(webserver).to.have.property('ssl_port');
    expect(webserver.ssl_port).to.be.null;
    expect(webserver).to.have.property('ssl_key');
    expect(webserver.ssl_key).to.be.null;
    expect(webserver).to.have.property('ssl_cert');
    expect(webserver.ssl_cert).to.be.null;
    expect(webserver).to.have.property('started');
    expect(webserver.started).to.be.false;
    expect(webserver).to.have.property('start');
    expect(webserver.start).to.be.a.Function;
  });

  before(function() {
    config = this.helpers.requireBackend('core').config('default');
    var expressFixtures = this.helpers.requireFixture('express');
    expressMock = expressFixtures.express();
    httpMock = expressFixtures.http();
    httpsMock = expressFixtures.https();
    serverInstance = {
        me: true,
        address: function() { return this._address; },
        on: function(event, callback) {
          if (event === 'listening') {
            process.nextTick(callback);
          }
        },
        removeListener: function() {}
      };
    sslserverInstance = Object.create(serverInstance);
    sslserver6Instance = Object.create(serverInstance);
    server6Instance = Object.create(serverInstance);

    serverInstance._address = { address: config.webserver.ip, port: config.webserver.port, family: 'IPv4' };
    sslserverInstance._address = { address: config.webserver.ssl_ip, port: config.webserver.port, family: 'IPv4' };
    server6Instance._address = { address: config.webserver.ipv6, port: config.webserver.ssl_port, family: 'IPv6' };
    sslserver6Instance._address = { address: config.webserver.ssl_ipv6, port: config.webserver.ssl_port, family: 'IPv6' };
  });

  beforeEach(function(done) {
    this.testEnv.initCore(done);
  });

  describe('the start method', function() {
    it('should start the web server (http ipv4 only)', function(done) {
      var serverMock = mockServer(this.testEnv.basePath);
      serverMock.webserver.ip = config.webserver.ip;
      serverMock.webserver.port = config.webserver.port;
      serverMock.webserver.start(function() {
        expect(serverMock.serverHttpsPort).to.be.undefined;
        expect(serverMock.serverHttpPort).to.be.equal(config.webserver.port);
        done();
      });
    });

    it('should start the web server (https ipv4 only)', function(done) {
      var serverMock = mockServer(this.testEnv.basePath);
      serverMock.webserver.ssl_ip = config.webserver.ssl_ip;
      serverMock.webserver.ssl_port = config.webserver.ssl_port;
      serverMock.webserver.ssl_cert = this.testEnv.fixtures + '/ssl.crt';
      serverMock.webserver.ssl_key = this.testEnv.fixtures + '/ssl.key';
      serverMock.webserver.start(function() {
        expect(serverMock.serverHttpsPort).to.be.equal(config.webserver.ssl_port);
        expect(serverMock.serverHttpPort).to.be.undefined;
        done();
      });
    });

    it('should start the web server (http+https ipv4)', function(done) {
      var serverMock = mockServer(this.testEnv.basePath);
      serverMock.webserver.ip = config.webserver.ip;
      serverMock.webserver.port = config.webserver.port;
      serverMock.webserver.ssl_ip = config.webserver.ssl_ip;
      serverMock.webserver.ssl_port = config.webserver.ssl_port;
      serverMock.webserver.ssl_cert = this.testEnv.fixtures + '/ssl.crt';
      serverMock.webserver.ssl_key = this.testEnv.fixtures + '/ssl.key';
      serverMock.webserver.start(function() {
        expect(serverMock.serverHttpsPort).to.be.equal(config.webserver.ssl_port);
        expect(serverMock.serverHttpPort).to.be.equal(config.webserver.port);
        done();
      });
    });
    it('should start the web server (ipv6)', function(done) {
      var serverMock = mockServer(this.testEnv.basePath);
      serverMock.webserver.ipv6 = config.webserver.ipv6;
      serverMock.webserver.ssl_ipv6 = config.webserver.ssl_ipv6;
      serverMock.webserver.port = config.webserver.port;
      serverMock.webserver.ssl_port = config.webserver.ssl_port;
      serverMock.webserver.ssl_cert = this.testEnv.fixtures + '/ssl.crt';
      serverMock.webserver.ssl_key = this.testEnv.fixtures + '/ssl.key';
      serverMock.webserver.start(function() {
        expect(serverMock.serverHttpsPort6).to.be.equal(config.webserver.ssl_port);
        expect(serverMock.serverHttpPort6).to.be.equal(config.webserver.port);
        done();
      });
    });
  });

  describe('The injections methods', function() {
    it('should populate injections with a formatted data', function() {
      var serverMock = mockServer(this.testEnv.basePath);
      serverMock.webserver.addJSInjection('myModule', ['myModule.js'], ['esn']);
      serverMock.webserver.addCSSInjection('myModule', ['myModule.css'], ['esn']);
      serverMock.webserver.addAngularModulesInjection('myModule2', ['myModule2.js'], ['esn.plugin.myModule2'], ['esn', 'welcome']);
      serverMock.webserver.addCSSInjection('myModule2', ['myModule2.css'], ['esn', 'welcome']);

      expect(serverMock.webserver.getInjections()).to.deep.equal(
        {
          'myModule': {
            'esn': {
              'js': ['myModule.js'],
              'css': ['myModule.css']
            }
          },
          'myModule2': {
            'esn': {
              'js': ['myModule2.js'],
              'css': ['myModule2.css'],
              'angular': ['esn.plugin.myModule2']
            },
            'welcome': {
              'js': ['myModule2.js'],
              'css': ['myModule2.css'],
              'angular': ['esn.plugin.myModule2']
            }
          }
        }
      );
    });
  });

  describe('the event emitters', function() {
    it('should call all listeners', function(done) {
      var serverMock = mockServer(this.testEnv.basePath);
      var webserver = serverMock.webserver;
      var topic = 'route:/api/function';

      var data = ['req', 'res', 'json']; // Usually actual objects
      var called = 0;

      function listener(req, res, next, json) {
        expect(req).to.be.equal('req');
        expect(res).to.be.equal('res');
        expect(json).to.be.equal('json');
        called++;
        next();
      }

      // Adding twice intentionally, to check if multiple listners are called
      webserver.on(topic, listener);
      webserver.on(topic, listener);

      webserver.emit('route:/api/function', data, function(err) {
        expect(called).to.equal(2);
        done(err);
      });
    });
  });

  describe('when started', function() {
    it('should set the webserver into the server property', function(done) {
      var serverMock = mockServer(this.testEnv.basePath);
      serverMock.webserver.ip = config.webserver.ip;
      serverMock.webserver.port = config.webserver.port;
      serverMock.webserver.ssl_ip = config.webserver.ip;
      serverMock.webserver.ssl_port = config.webserver.ssl_port;
      serverMock.webserver.ssl_cert = this.testEnv.fixtures + '/ssl.crt';
      serverMock.webserver.ssl_key = this.testEnv.fixtures + '/ssl.key';
      serverMock.webserver.start(function() {
        expect(serverInstance === serverMock.webserver.server).to.be.true;
        expect(sslserverInstance === serverMock.webserver.sslserver).to.be.true;
        done();
      });
    });
  });

  describe('AwesomeWebServer', function() {
    it('should provide a start state', function() {
      var module = this.helpers.requireBackend('webserver').awesomeWebServer;
      expect(module.settings.states.start).to.exist;
      expect(module.settings.states.start).to.be.a('function');
    });
  });
});
