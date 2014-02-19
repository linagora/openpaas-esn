'use strict';

var expect = require('chai').expect,
  mockery = require('mockery');

describe('The invitation core module', function() {

  describe('The init method', function() {
    it('should fail on missing invitation', function(done) {
      var invitation = require('../../../../backend/core/invitation');
      invitation.init(null, function(err, result) {
        expect(err).to.exist;
        done();
      });
    });

    it('should fail on missing invitation type', function(done) {
      var i = {data: {foo: 'bar'}};
      var invitation = require('../../../../backend/core/invitation');
      invitation.init(i, function(err, result) {
        expect(err).to.exist;
        done();
      });
    });

    it('should fail on unknown invitation type', function(done) {
      var i = {type: 'foobar', data: {foo: 'bar'}};
      var invitation = require('../../../../backend/core/invitation');
      invitation.init(i, function(err, result) {
        expect(err).to.exist;
        done();
      });
    });
  });

  describe('The process method', function() {
    it('should fail when invitation is not set', function(done) {
      var invitation = require('../../../../backend/core/invitation');
      var req = {};
      var res = {};
      invitation.process(req, res, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should call the default console handler', function(done) {
      var invitation = require('../../../../backend/core/invitation');
      var i = {
        type: 'console'
      };
      var req = {};
      req.invitation = i;
      var res = {
        redirect: function() {
          done();
        }
      };
      invitation.process(req, res, function(err) {
        // next has been called by the console handler
        expect(err).to.not.exist;
      });
    });

    it('should call the injected handler', function(done) {
      var invitation = require('../../../../backend/core/invitation');

      var handler = {
        init: function(invitation, cb) {
          return cb();
        },
        process: function(req, res, next) {
          return next(null, true);
        }
      };

      mockery.registerMock('./handlers/test', handler);
      mockery.registerMock('../../../../backend/core/invitation/handlers/test', handler);

      var i = {
        type: 'test',
        data: {
          foo: 'bar'
        }
      };

      var req = {};
      req.invitation = i;
      var res = {
        redirect: function(path) {
          console.log('Redirect to path : ', path);
          done();
        }
      };

      invitation.process(req, res, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.true;
        done();
      });
    });
  });
});
