'use strict';

var mockery = require('mockery');
var expect = require('chai').expect;

describe('The communities permission module', function() {

  describe('The canWrite fn', function() {

    it('should send back error if community is undefined', function(done) {
      mockery.registerMock('./index', {});
      var permission = require(this.testEnv.basePath + '/backend/core/community/permission');
      permission.canWrite(null, null, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back error if community does not have type property', function(done) {
      mockery.registerMock('./index', {});
      var permission = require(this.testEnv.basePath + '/backend/core/community/permission');
      permission.canWrite({foo: 'bar'}, null, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back true if community type is open', function(done) {
      mockery.registerMock('./index', {});
      var permission = require(this.testEnv.basePath + '/backend/core/community/permission');
      permission.canWrite({type: 'open'}, null, function(err, result) {
        expect(result).to.be.true;
        done();
      });
    });

    it('should send back error if community is not open but user undefined', function(done) {
      mockery.registerMock('./index', {});
      var permission = require(this.testEnv.basePath + '/backend/core/community/permission');
      permission.canWrite({type: 'notopen'}, null, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back error if community is restricted and isMember returns error', function(done) {
      mockery.registerMock('./index', {
        isMember: function(community, user, callback) {
          return callback(new Error());
        }
      });
      var permission = require(this.testEnv.basePath + '/backend/core/community/permission');
      permission.canWrite({type: 'restricted'}, {}, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back true if community is restricted and isMember returns true', function(done) {
      mockery.registerMock('./index', {
        isMember: function(community, user, callback) {
          return callback(null, true);
        }
      });
      var permission = require(this.testEnv.basePath + '/backend/core/community/permission');
      permission.canWrite({type: 'restricted'}, {}, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.true;
        done();
      });
    });

    it('should send back false if community is restricted and isMember returns false', function(done) {
      mockery.registerMock('./index', {
        isMember: function(community, user, callback) {
          return callback(null, false);
        }
      });
      var permission = require(this.testEnv.basePath + '/backend/core/community/permission');
      permission.canWrite({type: 'restricted'}, {}, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.false;
        done();
      });
    });

    it('should send back error when community and user are set to community is nor public not restricted', function(done) {
      mockery.registerMock('./index', {
        isMember: function(community, user, callback) {
          return done(new Error());
        }
      });
      var permission = require(this.testEnv.basePath + '/backend/core/community/permission');
      permission.canWrite({type: 'unsupportedtype'}, {}, function(err, result) {
        expect(err).to.exist;
        done();
      });
    });
  });

});
