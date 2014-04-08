'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');

describe('The addmember handler', function() {

  describe('The validate fn', function() {

    it('should fail if invitation data is not set', function(done) {
      var addmember = require(this.testEnv.basePath + '/backend/core/invitation/handlers/addmember');
      addmember.validate({}, function(err, result) {
        expect(result).to.be.false;
        done();
      });
    });

    it('should fail if email is not set', function(done) {
      var addmember = require(this.testEnv.basePath + '/backend/core/invitation/handlers/addmember');
      addmember.validate({data: {user: {}, domain: {}, foo: 'bar'}}, function(err, result) {
        expect(result).to.be.false;
        done();
      });
    });

    it('should be ok if required data is set', function(done) {
      var addmember = require(this.testEnv.basePath + '/backend/core/invitation/handlers/addmember');
      addmember.validate({data: {user: {}, domain: {}, email: 'baz@me.org'}}, function(err, result) {
        expect(result).to.be.true;
        done();
      });
    });

    it('should fail is email is not an email', function(done) {
      var addmember = require(this.testEnv.basePath + '/backend/core/invitation/handlers/addmember');
      addmember.validate({data: {user: {}, domain: {}, email: 'baz'}}, function(err, result) {
        expect(result).to.be.false;
        done();
      });
    });
  });

  describe('The init fn', function() {

    it('should fail if invitation uuid is not set', function(done) {
      var addmember = require(this.testEnv.basePath + '/backend/core/invitation/handlers/addmember');
      addmember.init({}, function(err, result) {
        expect(err).to.exist;
        done();
      });
    });

    it('should fail if invitation url is not set', function(done) {
      var addmember = require(this.testEnv.basePath + '/backend/core/invitation/handlers/addmember');
      addmember.init({uuid: 123, data: {}}, function(err, result) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send an invitation email if all data is valid', function(done) {
      var mock = function(invitation, cb) {
        return cb(null, true);
      };

      mockery.registerMock('../../email/system/addMember', mock);
      var invitation = {
        uuid: '123456789',
        data: {
          email: 'foo@bar.com',
          url: 'http://localhost:8080/invitation/123456789'
        }
      };

      var addmember = require(this.testEnv.basePath + '/backend/core/invitation/handlers/addmember');
      addmember.init(invitation, function(err, response) {
        expect(err).to.not.exist;
        expect(response).to.be.true;
        done();
      });
    });
  });

  describe('The process fn', function() {

    it('should redirect to the invitation app if invitation is found', function(done) {
      var addmember = require(this.testEnv.basePath + '/backend/core/invitation/handlers/addmember');

      var invitation = {
        uuid: 12345678
      };

      addmember.process(invitation, {}, function(err, data) {
        expect(err).to.not.exist;
        expect(data).to.exist;
        expect(data.redirect).to.exist;
        done();
      });
    });

    it('should send back error if invitation is not found', function(done) {
      var addmember = require(this.testEnv.basePath + '/backend/core/invitation/handlers/addmember');
      addmember.process(null, {}, function(err) {
        expect(err).to.exist;
        done();
      });
    });
  });

  describe('The finalize fn', function() {

    it('should send back error if invitation is not found', function(done) {
      var addmember = require(this.testEnv.basePath + '/backend/core/invitation/handlers/addmember');
      addmember.finalize(null, {}, function(err) {
        expect(err).to.exist;
        done();
      });
    });
  });
});
