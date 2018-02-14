'use strict';

var expect = require('chai').expect,
    mockery = require('mockery');

describe('the webserver-wrapper', function() {
  var module;

  function getApi(module, callback) {
    module.settings.states.lib([], callback);
  }

  it('should expose some methods', function() {
    mockery.registerMock('./', {
      webserver: {
        on: function() {},
        addAngularModulesInjection: function() {}
      }
    });
    module = this.helpers.requireBackend('webserver/webserver-wrapper');
    getApi(module, function(err, api) {
      expect(err).to.be.null;
      expect(api.injectJS).to.exist;
      expect(api.injectJS).to.be.a('function');
      expect(api.injectAngularModules).to.exist;
      expect(api.injectAngularModules).to.be.a('function');
      expect(api.addApp).to.exist;
      expect(api.addApp).to.be.a('function');
      expect(api.on).to.be.a('function');
      expect(api.injectLess).to.be.a('function');
      expect(api.requestCoreFrontendInjections).to.be.a('function');
    });
  });

  it('should call webserver.addJSInjection with arrays', function(done) {
    var webserverMock = {
      webserver: {
        on: function() {},
        addAngularModulesInjection: function() {},
        addJSInjection: function(namespace, js, apps) {
          expect(namespace).to.equal('myModule');
          expect(js).to.deep.equal(['mymodule.js']);
          expect(apps).to.deep.equal(['esn']);
          done();
        }
      }
    };
    mockery.registerMock('./', webserverMock);
    module = this.helpers.requireBackend('webserver/webserver-wrapper');
    getApi(module, function(err, api) {
      api.injectJS('myModule', 'mymodule.js', 'esn');
    });
  });

  it('should call webserver.addAngularModulesInjection with arrays', function(done) {
    var webserverMock = {
      webserver: {
        on: function() {},
        addAngularModulesInjection: function() {}
      }
    };
    mockery.registerMock('./', webserverMock);
    module = this.helpers.requireBackend('webserver/webserver-wrapper');
    getApi(module, function(err, api) {
      webserverMock.webserver.addAngularModulesInjection = function(namespace, js, angularModules, apps) {
        expect(namespace).to.equal('myModule');
        expect(js).to.deep.equal(['mymodule.js']);
        expect(angularModules).to.deep.equal(['myAngularModule']);
        expect(apps).to.deep.equal(['esn']);
        done();
      };
      api.injectAngularModules('myModule', 'mymodule.js', 'myAngularModule', 'esn');
    });
  });

    it('should call webserver.addAngularModulesInjection with opts object', function(done) {
    var webserverMock = {
      webserver: {
        on: function() {},
        addAngularModulesInjection: function() {}
      }
    };
    mockery.registerMock('./', webserverMock);
    module = this.helpers.requireBackend('webserver/webserver-wrapper');
    getApi(module, function(err, api) {
      webserverMock.webserver.addAngularModulesInjection = function(namespace, js, angularModules, apps, opts) {
        expect(opts).to.deep.equal({localJsFiles: ['test1.js', 'test2.js']});
        done();
      };
      api.injectAngularModules('myModule', 'mymodule.js', 'myAngularModule', 'esn', {localJsFiles: ['test1.js', 'test2.js']});
    });
  });

  it('should call webserver.addLessInjection with arrays', function(done) {
    const webserverMock = {
      webserver: {
        on: function() {},
        addAngularModulesInjection: function() {},
        addLessInjection: function(namespace, less, apps) {
          expect(namespace).to.equal('myModule');
          expect(less).to.deep.equal(['my/file.less']);
          expect(apps).to.deep.equal(['esn']);
          done();
        }
      }
    };

    mockery.registerMock('./', webserverMock);
    module = this.helpers.requireBackend('webserver/webserver-wrapper');
    getApi(module, function(err, api) {
      api.injectLess('myModule', 'my/file.less', 'esn');
    });

  });

  it('should call webserver.application.use', function(done) {
    var webserverMock = {
      webserver: {
        on: function() {},
        addAngularModulesInjection: function() {},
        application: {
          use: function(baseUri) {
            expect(baseUri).to.equal('/myModule');
            done();
          }
        }
      }
    };
    mockery.registerMock('./', webserverMock);
    module = this.helpers.requireBackend('webserver/webserver-wrapper');
    getApi(module, function(err, api) {
      api.addApp('myModule', 'module');
    });
  });

  describe('proxy method', function() {
    beforeEach(function() {
      module = this.helpers.requireBackend('webserver/webserver-wrapper');
      this.proxy = module.settings.proxy;
    });

    describe('when requester is trusted', function() {
      it('should return the lib', function() {
        var lib = {test: true};
        var response = this.proxy.call(lib, 'module1', true);
        expect(response).to.deep.equal(lib);
      });
    });

    describe('when requester is untrusted', function() {
      it('should return a proxy object', function() {
        var lib = {test: true};
        var response = this.proxy.call(lib, 'module1', false);
        expect(response).to.not.have.property('test');
        expect(response).to.have.property('injectJS');
        expect(response).to.have.property('injectAngularModules');
        expect(response).to.have.property('addApp');
      });
      it('injectJS() should force the namespace on proxied methods', function(done) {
        var lib = {
          injectJS: function(namespace) {
            expect(namespace).to.equal('module1');
            done();
          }
        };
        var response = this.proxy.call(lib, 'module1', false);
        response.injectJS('some', 'cool', 'params');
      });
      it('addApp() should force the namespace on proxied methods', function(done) {
        var lib = {
          addApp: function(namespace) {
            expect(namespace).to.equal('module1');
            done();
          }
        };
        var response = this.proxy.call(lib, 'module1', false);
        response.addApp('some', 'cool', 'params');
      });
      it('injectAngularModules() should force the namespace on proxied methods', function(done) {
        var lib = {
          injectAngularModules: function(namespace) {
            expect(namespace).to.equal('module1');
            done();
          }
        };
        var response = this.proxy.call(lib, 'module1', false);
        response.injectAngularModules('some', 'cool', 'params');
      });
    });
  });
});
