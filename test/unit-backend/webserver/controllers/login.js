'use strict';

var expect = require('chai').expect,
    mockery = require('mockery');

describe('the login controller', function() {
  describe('index function', function() {
    it('should redirect to / when authenticated', function(done) {
      mockery.registerMock('../../core/user', {});
      mockery.registerMock('../../core/user/login', {});
      var login = this.helpers.requireBackend('webserver/controllers/login');

      var req = {
        user: {},
        query: {}
      };
      var res = {
        redirect: function(target) {
          expect(target).to.equal('/');
          done();
        }
      };

      login.index(req, res);
    });

    it('should redirect to /login when not authenticated', function(done) {
      mockery.registerMock('../../core/user', {});
      mockery.registerMock('../../core/user/login', {});
      var login = this.helpers.requireBackend('webserver/controllers/login');

      var req = {
        user: null,
        query: {}
      };
      var res = {
        redirect: function(target) {
          expect(target).to.equal('/#/login');
          done();
        }
      };

      login.index(req, res);
    });

    it('should redirect to / when authenticated despite continue url', function(done) {
      mockery.registerMock('../../core/user', {});
      mockery.registerMock('../../core/user/login', {});
      var login = this.helpers.requireBackend('webserver/controllers/login');

      var req = {
        user: {},
        query: {}
      };
      var res = {
        redirect: function(target) {
          expect(target).to.equal('/');
          done();
        }
      };

      login.index(req, res);
    });

    it('should use the continue url when not authenticated', function(done) {
      mockery.registerMock('../../core/user', {});
      mockery.registerMock('../../core/user/login', {});
      var login = this.helpers.requireBackend('webserver/controllers/login');

      var req = {
        user: null,
        query: { continue: 'dummy' }
      };
      var res = {
        redirect: function(target) {
          expect(target).to.equal('/#/login?continue=dummy');
          done();
        }
      };

      login.index(req, res);
    });
  });
});
