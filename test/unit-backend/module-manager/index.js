'use strict';

var mockery = require('mockery');
var expect = require('chai').expect;

describe('The module manager', function() {

  it('should expose the manager property', function() {
    var mm = require(this.testEnv.basePath + '/backend/module-manager');
    expect(mm).to.have.property('manager');
    expect(mm.manager).to.be.an('object');
  });

  it('should expose the ESN_MODULE_PREFIX property', function() {
    var mm = require(this.testEnv.basePath + '/backend/module-manager');
    expect(mm).to.have.property('ESN_MODULE_PREFIX');
    expect(mm.ESN_MODULE_PREFIX).to.be.a('string');
  });

  it('should expose the setupManager property', function() {
    var mm = require(this.testEnv.basePath + '/backend/module-manager');
    expect(mm).to.have.property('setupManager');
    expect(mm.setupManager).to.be.a('function');
  });

  it('should expose the mockModule property', function() {
    var mm = require(this.testEnv.basePath + '/backend/module-manager');
    expect(mm).to.have.property('mockModule');
    expect(mm.mockModule).to.be.a('function');
  });

  describe('setupManager() method', function() {
    beforeEach(function() {
      var self = this;
      this.registeredMocks = [];
      this.registeredLoaders = [];
      this.core = {};
      mockery.registerMock('../core', this.core);
      this.mmMock = function() {
        this.loaders = {
          code: function(mock) {
            self.registeredMocks.push(mock);
            return {mock: mock};
          }
        };
        this.appendLoader = function(mock) {
          self.registeredLoaders.push(mock);
        };
      };
    });

    it('should register module code loader for every core module', function() {
      mockery.registerMock('awesome-module-manager', this.mmMock);
      var coreModules = [
        'linagora.esn.core.activitystreams',
        'linagora.esn.core.addressbook',
        'linagora.esn.core.auth',
        'linagora.esn.core.caldav',
        'linagora.esn.core.calendar',
        'linagora.esn.core.collaboration',
        'linagora.esn.core.community',
        'linagora.esn.core.conference',
        'linagora.esn.core.config',
        'linagora.esn.core.configured',
        'linagora.esn.core.contact',
        'linagora.esn.core.db',
        'linagora.esn.core.domain',
        'linagora.esn.core.elasticsearch',
        'linagora.esn.core.email',
        'linagora.esn.core.esn-config',
        'linagora.esn.core.feedback',
        'linagora.esn.core.filestore',
        'linagora.esn.core.image',
        'linagora.esn.core.invitation',
        'linagora.esn.core.ldap',
        'linagora.esn.core.logger',
        'linagora.esn.core.message',
        'linagora.esn.core.monitoring',
        'linagora.esn.core.notification',
        'linagora.esn.core.passport',
        'linagora.esn.core.pubsub',
        'linagora.esn.core.templates',
        'linagora.esn.core.user',
        'linagora.esn.core.webserver.middleware.activitystream',
        'linagora.esn.core.webserver.middleware.authentication',
        'linagora.esn.core.webserver.middleware.authorization',
        'linagora.esn.core.webserver.middleware.community',
        'linagora.esn.core.webserver.middleware.conference',
        'linagora.esn.core.webserver.middleware.cookie-lifetime',
        'linagora.esn.core.webserver.middleware.feedback',
        'linagora.esn.core.webserver.middleware.file',
        'linagora.esn.core.webserver.middleware.link',
        'linagora.esn.core.webserver.middleware.login-rules',
        'linagora.esn.core.webserver.middleware.message',
        'linagora.esn.core.webserver.middleware.notification',
        'linagora.esn.core.webserver.middleware.request',
        'linagora.esn.core.webserver.middleware.setup-routes',
        'linagora.esn.core.webserver.middleware.setup-sessions',
        'linagora.esn.core.webserver.middleware.setup-settings',
        'linagora.esn.core.webserver.middleware.startup-buffer',
        'linagora.esn.core.webserver.middleware.templates',
        'linagora.esn.core.webserver.middleware.usernotifications',
        'linagora.esn.core.webserver.middleware.verify-recaptcha'
      ];
      var mm = require(this.testEnv.basePath + '/backend/module-manager');
      mm.setupManager();
      var registeredModules = this.registeredMocks.map(function(m) { return m.name;});
      registeredModules.sort();
      expect(registeredModules).to.deep.equal(coreModules);
    });

    it('should add itself to the core object', function() {
      mockery.registerMock('awesome-module-manager', this.mmMock);
      var mm = require(this.testEnv.basePath + '/backend/module-manager');
      mm.setupManager();
      expect(this.core).to.have.property('moduleManager');
      expect(this.core.moduleManager).to.be.an('object');
      expect(this.core.moduleManager).to.have.property('appendLoader');
    });
  });

  describe('mockModule() method', function() {
    beforeEach(function() {
      var self = this;
      this.registeredMocks = [];
      this.registeredLoaders = [];
      this.core = {};
      mockery.registerMock('../core', this.core);
      this.mmMock = function() {
        this.loaders = {
          code: function(mock) {
            self.registeredMocks.push(mock);
            return mock;
          }
        };
        this.appendLoader = function(mock) {
          self.registeredLoaders.push(mock);
        };
      };
    });

    it('should create a code loader with the module as a parameter', function() {
      mockery.registerMock('awesome-module-manager', this.mmMock);
      var mm = require(this.testEnv.basePath + '/backend/module-manager');
      mm.mockModule('test', {greatModule: true});
      expect(this.registeredMocks).to.have.length(1);
      expect(this.registeredMocks[0]).to.have.property('name');
      expect(this.registeredMocks[0].name).to.equal('linagora.esn.core.test');
    });

    it('should append the code loader', function() {
      mockery.registerMock('awesome-module-manager', this.mmMock);
      var mm = require(this.testEnv.basePath + '/backend/module-manager');
      mm.mockModule('test', {greatModule: true});
      expect(this.registeredMocks).to.have.length(1);
      expect(this.registeredLoaders).to.have.length(1);
      expect(this.registeredMocks).to.deep.equal(this.registeredLoaders);
    });
  });
});
