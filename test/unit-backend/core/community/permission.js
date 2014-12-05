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

    it('should send back error if community type is unsupported and user undefined', function(done) {
      mockery.registerMock('./index', {});
      var permission = require(this.testEnv.basePath + '/backend/core/community/permission');
      permission.canWrite({type: 'unsupportedtype'}, null, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    // NOTE: The testcases for restricted communities also cover private and
    // confidential cases, since at this point the member type is the only
    // important thing also cover private and confidential cases, since at this
    // point the member type is the only important thing.

    it('should send back error if community is restricted and isMember returns error', function(done) {
      mockery.registerMock('./index', {
        isMember: function(community, tuple, callback) {
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
        isMember: function(community, tuple, callback) {
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
        isMember: function(community, tuple, callback) {
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
  });


  describe('The supportsMemberShipRequests fn', function() {

    it('should return false if community is undefined', function() {
      mockery.registerMock('./index', {});
      var permission = require(this.testEnv.basePath + '/backend/core/community/permission');
      var result = permission.supportsMemberShipRequests(null);
      expect(result).to.be.false;
    });

    it('should return false if community does not have type property', function() {
      mockery.registerMock('./index', {});
      var permission = require(this.testEnv.basePath + '/backend/core/community/permission');
      var result = permission.supportsMemberShipRequests({foo: 'bar'});
      expect(result).to.be.false;
    });

    it('should return false if community is not private or restricted', function() {
      mockery.registerMock('./index', {});
      var permission = require(this.testEnv.basePath + '/backend/core/community/permission');
      var result = permission.supportsMemberShipRequests({type: 'bar'});
      expect(result).to.be.false;
    });

    it('should return false if community is private', function() {
      mockery.registerMock('./index', {});
      var permission = require(this.testEnv.basePath + '/backend/core/community/permission');
      var result = permission.supportsMemberShipRequests({type: 'private'});
      expect(result).to.be.true;
    });

    it('should return false if community is restricted', function() {
      mockery.registerMock('./index', {});
      var permission = require(this.testEnv.basePath + '/backend/core/community/permission');
      var result = permission.supportsMemberShipRequests({type: 'restricted'});
      expect(result).to.be.true;
    });

  });

});
