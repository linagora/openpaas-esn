'use strict';

var expect = require('chai').expect;

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
      addmember.validate({data: {foo: 'bar'}}, function(err, result) {
        expect(result).to.be.false;
        done();
      });
    });

    it('should be ok if required data is set', function(done) {
      var addmember = require(this.testEnv.basePath + '/backend/core/invitation/handlers/addmember');
      addmember.validate({data: {firstname: 'foo', lastname: 'bar', domain: 'domain', email: 'baz@me.org'}}, function(err, result) {
        expect(result).to.be.true;
        done();
      });
    });

    it('should fail is email is not an email', function(done) {
      var addmember = require(this.testEnv.basePath + '/backend/core/invitation/handlers/addmember');
      addmember.validate({data: {firstname: 'foo', lastname: 'bar', domain: 'domain', email: 'baz'}}, function(err, result) {
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
      var invitation = {
        uuid: '123456789',
        data: {
          email: 'foo@bar.com',
          url: 'http://localhost:8080/invitation/123456789'
        }
      };

      var addmember = require(this.testEnv.basePath + '/backend/core/invitation/handlers/addmember');
      addmember.init(invitation, function(err, response) {
        expect(err).to.exist;
        done();
      });
    });
  });

  describe('The process fn', function() {

    it('should redirect to the invitation app if invitation is found', function(done) {
      var addmember = require(this.testEnv.basePath + '/backend/core/invitation/handlers/addmember');

      var req = {
        invitation: {
          uuid: 12345678
        }
      };

      var res = {
        redirect: function() {
          done();
        }
      };

      var next = function() {
      };
      addmember.process(req, res, next);
    });

    it('should call next if invitation is not found', function(done) {
      var addmember = require(this.testEnv.basePath + '/backend/core/invitation/handlers/addmember');

      var req = {
      };

      var res = {
        redirect: function() {
        }
      };

      var next = function() {
        done();
      };
      addmember.process(req, res, next);
    });
  });

  describe('The finalize fn', function() {

    it('should call next if invitation is not found', function(done) {
      var addmember = require(this.testEnv.basePath + '/backend/core/invitation/handlers/addmember');

      var req = {
      };

      var res = {
        redirect: function() {
        }
      };

      var next = function() {
        done();
      };
      addmember.finalize(req, res, next);
    });

    it('should call next if body data is not set', function(done) {
      var addmember = require(this.testEnv.basePath + '/backend/core/invitation/handlers/addmember');

      var req = {
        body: {},
        invitation: {}
      };

      var res = {
        redirect: function() {
        }
      };

      var next = function() {
        done();
      };

      addmember.finalize(req, res, next);
    });

    it('should send HTTP 500 if invitation and body data are set', function(done) {
      var addmember = require(this.testEnv.basePath + '/backend/core/invitation/handlers/addmember');

      var req = {
        body: {
          data: {}
        },
        invitation: {}
      };

      var res = {
        json: function(status) {
          expect(status).to.equal(500);
          done();
        }
      };

      var next = function() {
      };

      addmember.finalize(req, res, next);
    });
  });
});
