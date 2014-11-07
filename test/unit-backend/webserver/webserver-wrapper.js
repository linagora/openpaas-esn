'use strict';

var expect = require('chai').expect,
    mockery = require('mockery');

describe('the webserver-wrapper', function() {
  var module;

  function getApi(module, callback) {
    module.settings.states.lib([], function(err, api) {
      return callback(err, api);
    });
  }

  it('should expose some methods', function() {
    mockery.registerMock('./', {});
    module = require(this.testEnv.basePath + '/backend/webserver/webserver-wrapper');
    getApi(module, function(err, api) {
      expect(api.injectJS).to.exist;
      expect(api.injectJS).to.be.a.function;
      expect(api.injectCSS).to.exist;
      expect(api.injectCSS).to.be.a.function;
      expect(api.injectAngularModules).to.exist;
      expect(api.injectAngularModules).to.be.a.function;
      expect(api.addApp).to.exist;
      expect(api.addApp).to.be.a.function;
    });
  });

  it('should call webserver.addJSInjection with arrays', function(done) {
    var webserverMock = {
      webserver: {
        addJSInjection: function(namespace, js, apps) {
          expect(namespace).to.equal('myModule');
          expect(js).to.deep.equal(['mymodule.js']);
          expect(apps).to.deep.equal(['esn']);
          done();
        }
      }
    };
    mockery.registerMock('./', webserverMock);
    module = require(this.testEnv.basePath + '/backend/webserver/webserver-wrapper');
    getApi(module, function(err, api) {
      api.injectJS('myModule', 'mymodule.js', 'esn');
    });
  });

  it('should call webserver.addCSSInjection with arrays', function(done) {
    var webserverMock = {
      webserver: {
        addCSSInjection: function(namespace, css, apps) {
          expect(namespace).to.equal('myModule');
          expect(css).to.deep.equal(['mymodule.css']);
          expect(apps).to.deep.equal(['esn']);
          done();
        }
      }
    };
    mockery.registerMock('./', webserverMock);
    module = require(this.testEnv.basePath + '/backend/webserver/webserver-wrapper');
    getApi(module, function(err, api) {
      api.injectCSS('myModule', 'mymodule.css', 'esn');
    });
  });

  it('should call webserver.addAngularModulesInjection with arrays', function(done) {
    var webserverMock = {
      webserver: {
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
    module = require(this.testEnv.basePath + '/backend/webserver/webserver-wrapper');
    getApi(module, function(err, api) {
      api.injectAngularModules('myModule', 'mymodule.js', 'myAngularModule', 'esn');
    });
  });

  it('should call webserver.application.use', function(done) {
    var webserverMock = {
      webserver: {
        application: {
          use: function(baseUri) {
            expect(baseUri).to.equal('/myModule');
            done();
          }
        }
      }
    };
    mockery.registerMock('./', webserverMock);
    module = require(this.testEnv.basePath + '/backend/webserver/webserver-wrapper');
    getApi(module, function(err, api) {
      api.addApp('myModule', 'module');
    });
  });
});
