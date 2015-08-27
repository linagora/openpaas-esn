'use strict';
var expect = require('chai').expect;

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
      var res = {
        send: function(code) {
          expect(code).to.equal(404);
          done();
        }
      };
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
    it('should send a 500 error when the less compilation fails', function(done) {
      var res = {
        send: function(code) {
          expect(code).to.equal(500);
          done();
        }
      };
      var css = this.helpers.requireBackend('core').css;
      css.addLessInjection('modX', [this.testEnv.fixtures + '/css/file2.less'], ['foo']);
      this.controller.getCss({params: {app: 'foo'}}, res);
    });
  });
});
