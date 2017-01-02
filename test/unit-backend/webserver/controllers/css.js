'use strict';

var expect = require('chai').expect;
const mockery = require('mockery');
const q = require('q');

describe('the css webserver controller', function() {
  it('should expose a getCss method', function() {
    var controller = this.helpers.requireBackend('webserver/controllers/css');
    expect(controller).to.have.property('getCss');
    expect(controller.getCss).to.be.a('function');
  });
  describe('getCss() method', function() {
    beforeEach(function() {
      this.controller = this.helpers.requireBackend('webserver/controllers/css');
    });
    it('should return a 404 error if the params.app is not defined', function(done) {
      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(404);
          done();
        }
      );
      this.controller.getCss({params: {}}, res);
    });
    it('should return the base CSS file', function(done) {
      var res = {
        send: function(css) {
          expect(css).to.be.a('string');
          expect(css).to.match(/@media screen and/);
          done();
        },
        set: function(name, value) {
          expect(name).to.equal('Content-Type');
          expect(value).to.equal('text/css');
        }
      };
      this.controller.getCss({params: {app: 'foo'}}, res);
    });
    it('should concatenate the injected less files', function(done) {
      var res = {
        send: function(css) {
          expect(css).to.be.a('string');
          expect(css).to.match(/thisIsAClassForTheTest/);
          done();
        },
        set: function(name, value) {
          expect(name).to.equal('Content-Type');
          expect(value).to.equal('text/css');
        }
      };
      var css = this.helpers.requireBackend('core').css;
      css.addLessInjection('modX', [this.testEnv.fixtures + '/css/file.less'], ['foo']);
      this.controller.getCss({params: {app: 'foo'}}, res);
    });
    it('should use injected global variable', function(done) {
      var res = {
        send: function(css) {
          expect(css).to.be.a('string');
          expect(css).to.match(/thisIsAClassForTheTest/);
          expect(css).to.match(/components\/cssinjecttest/);
          done();
        },
        set: function(name, value) {
          expect(name).to.equal('Content-Type');
          expect(value).to.equal('text/css');
        }
      };
      var css = this.helpers.requireBackend('core').css;
      css.addLessInjection('modX', [this.testEnv.fixtures + '/css/file3.less'], ['foo']);
      this.controller.getCss({params: {app: 'foo'}}, res);
    });
    it('should send a 500 error when the less compilation fails', function(done) {
      var res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(500);
          done();
        }
      );
      var css = this.helpers.requireBackend('core').css;
      css.addLessInjection('modX', [this.testEnv.fixtures + '/css/file2.less'], ['foo']);
      this.controller.getCss({params: {app: 'foo'}}, res);
    });
  });
  describe('cache', function() {
    let constructorCalled = 0;
    let getCalled = 0;
    let initialNodeEnv;

    class MemoryStoreMock {
      constructor() {
        constructorCalled++;
        this.response = q(true);
      }

      get() {
        getCalled++;
        return this.response;
      }
    }

    beforeEach(function() {
      constructorCalled = 0;
      getCalled = 0;
      initialNodeEnv = process.env.NODE_ENV;
    });

    afterEach(function() {
      process.env.NODE_ENV = initialNodeEnv;
    });

    it('should use the cache the second time it\'s called in production mode', function(done) {
      mockery.registerMock('../../helpers/memory-store', MemoryStoreMock);
      process.env.NODE_ENV = 'production';
      const controller = this.helpers.requireBackend('webserver/controllers/css');
      const res = {
        send: function() {
          controller.getCss({params: {app: 'foo'}}, {
            set: function() {
            },
            send: function() {
              expect(constructorCalled).to.equal(1);
              expect(getCalled).to.equal(2);
              done();
            }
          });
        },
        set: function() {
        }
      };

      controller.getCss({params: {app: 'foo'}}, res);
    });

    it('should not use the cache in dev mode', function(done) {
      mockery.registerMock('../../helpers/memory-store', MemoryStoreMock);
      process.env.NODE_ENV = 'dev';
      const controller = this.helpers.requireBackend('webserver/controllers/css');
      const res = {
        send: function() {
          controller.getCss({params: {app: 'foo'}}, {
            set: function() {
            },
            send: function() {
              expect(constructorCalled).to.equal(0);
              expect(getCalled).to.equal(0);
              done();
            }
          });
        },
        set: function() {
        }
      };

      controller.getCss({params: {app: 'foo'}}, res);
    });

    it('should not use the cache in test mode', function(done) {
      mockery.registerMock('../../helpers/memory-store', MemoryStoreMock);
      process.env.NODE_ENV = 'test';
      const controller = this.helpers.requireBackend('webserver/controllers/css');
      const res = {
        send: function() {
          controller.getCss({params: {app: 'foo'}}, {
            set: function() {
            },
            send: function() {
              expect(constructorCalled).to.equal(0);
              expect(getCalled).to.equal(0);
              done();
            }
          });
        },
        set: function() {
        }
      };

      controller.getCss({params: {app: 'foo'}}, res);
    });
  });
});
