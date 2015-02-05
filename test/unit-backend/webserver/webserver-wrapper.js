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
      webserver: { on: function() {} }
    });
    module = this.helpers.requireBackend('webserver/webserver-wrapper');
    getApi(module, function(err, api) {
      expect(err).to.be.null;
      expect(api.injectJS).to.exist;
      expect(api.injectJS).to.be.a.function;
      expect(api.injectCSS).to.exist;
      expect(api.injectCSS).to.be.a.function;
      expect(api.injectAngularModules).to.exist;
      expect(api.injectAngularModules).to.be.a.function;
      expect(api.addApp).to.exist;
      expect(api.addApp).to.be.a.function;
      expect(api.on).to.be.a.function;
    });
  });

  it('should call webserver.addJSInjection with arrays', function(done) {
    var webserverMock = {
      webserver: {
        on: function() {},
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

  it('should call webserver.addCSSInjection with arrays', function(done) {
    var webserverMock = {
      webserver: {
        on: function() {},
        addCSSInjection: function(namespace, css, apps) {
          expect(namespace).to.equal('myModule');
          expect(css).to.deep.equal(['mymodule.css']);
          expect(apps).to.deep.equal(['esn']);
          done();
        }
      }
    };
    mockery.registerMock('./', webserverMock);
    module = this.helpers.requireBackend('webserver/webserver-wrapper');
    getApi(module, function(err, api) {
      api.injectCSS('myModule', 'mymodule.css', 'esn');
    });
  });

  it('should call webserver.addAngularModulesInjection with arrays', function(done) {
    var webserverMock = {
      webserver: {
        on: function() {},
        addAngularModulesInjection: function(namespace, js, angularModules, apps) {
          expect(namespace).to.equal('myModule');
          expect(js).to.deep.equal(['mymodule.js']);
          expect(angularModules).to.deep.equal(['myAngularModule']);
          expect(apps).to.deep.equal(['esn']);
          done();
        }
      }
    };
    mockery.registerMock('./', webserverMock);
    module = this.helpers.requireBackend('webserver/webserver-wrapper');
    getApi(module, function(err, api) {
      api.injectAngularModules('myModule', 'mymodule.js', 'myAngularModule', 'esn');
    });
  });

  it('should call webserver.application.use', function(done) {
    var webserverMock = {
      webserver: {
        on: function() {},
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
        expect(response).to.have.property('injectCSS');
        expect(response).to.have.property('injectAngularModules');
        expect(response).to.have.property('addApp');
      });
      it('injectCSS() should force the namespace on proxied methods', function(done) {
        var lib = {
          injectCSS: function(namespace) {
            expect(namespace).to.equal('module1');
            done();
          }
        };
        var response = this.proxy.call(lib, 'module1', false);
        response.injectCSS('some', 'cool', 'params');
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
