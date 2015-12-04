'use strict';

var chai = require('chai');
var expect = chai.expect;
var mockery = require('mockery');
var sinon = require('sinon');

describe('The contact import backend module', function() {

  describe('The start function', function() {
    var deps;

    var dependencies = function(name) {
      return deps[name];
    };

    var getModule = function() {
      return require('../../../backend/lib/index')(dependencies);
    };

    beforeEach(function() {
      deps = {
        logger: {
          debug: console.log,
          info: console.log,
          error: console.log
        }
      };
    });

    it('should create as many webapp as there are importers', function(done) {

      var angularSpy = sinon.spy();
      var addAppSpy = sinon.spy();
      var getStaticAppSpy = sinon.spy();

      var importers = {
        twitter: {
          name: 'twitter',
          frontend: {
            modules: ['app.js', 'services.js'],
            moduleName: 'linagora.esn.contact.import.twitter',
            staticPath: '/foo/bar/baz/twitter'
          }
        },
        github: {
          name: 'github',
          frontend: {
            modules: ['app.js', 'services.js'],
            moduleName: 'linagora.esn.contact.import.github',
            staticPath: '/foo/bar/baz/github'
          }
        }
      };

      mockery.registerMock('../webserver', function() {
        return {
          getStaticApp: getStaticAppSpy
        };
      });

      mockery.registerMock('./importers', function() {
        return {
          list: function() {
            return importers;
          }
        };
      });

      deps['webserver-wrapper'] = {
        injectAngularModules: angularSpy,
        addApp: addAppSpy
      };

      getModule().start(function() {
        expect(getStaticAppSpy).to.have.been.calledTwice;
        expect(angularSpy).to.have.been.calledTwice;
        expect(addAppSpy).to.have.been.calledTwice;
        done();
      });
    });
  });
});
