'use strict';

var mockery = require('mockery');
var expect = require('chai').expect;

describe('The domain module', function() {
  describe('The load fn', function() {
    it('should send back error when id is undefined', function(done) {
      var mongooseMock = {
        model: function() {
          return {};
        }
      };
      mockery.registerMock('mongoose', mongooseMock);
      var domain = require(this.testEnv.basePath + '/backend/core/domain');
      domain.load(null, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should call Domain.findOne', function(done) {
      var called = false;
      var mongooseMock = {
        model: function() {
          return {
            findOne: function(id, callback) {
              called = true;
              return callback();
            }
          };
        }
      };
      mockery.registerMock('mongoose', mongooseMock);
      var domain = require(this.testEnv.basePath + '/backend/core/domain');
      domain.load(123, function(err) {
        expect(err).to.not.exist;
        expect(called).to.be.true;
        done();
      });
    });
  });

  describe('The userIsDomainAdministrator fn', function() {
    it('should send back error when user is undefined', function(done) {
      mockery.registerMock('mongoose', {model: function() {}});

      var domain = require(this.testEnv.basePath + '/backend/core/domain');
      domain.userIsDomainAdministrator(null, {_id: 123}, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back error when user._id is undefined', function(done) {
      mockery.registerMock('mongoose', {model: function() {}});

      var domain = require(this.testEnv.basePath + '/backend/core/domain');
      domain.userIsDomainAdministrator({}, {_id: 123}, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back error when domain is undefined', function(done) {
      mockery.registerMock('mongoose', {model: function() {}});

      var domain = require(this.testEnv.basePath + '/backend/core/domain');
      domain.userIsDomainAdministrator({_id: 123}, null, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back error when domain._id is undefined', function(done) {
      mockery.registerMock('mongoose', {model: function() {}});

      var domain = require(this.testEnv.basePath + '/backend/core/domain');
      domain.userIsDomainAdministrator({_id: 123}, {}, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back false when domain.administrator is undefined', function(done) {
      mockery.registerMock('mongoose', {model: function() {}});

      var domain = require(this.testEnv.basePath + '/backend/core/domain');
      domain.userIsDomainAdministrator({_id: 123}, {_id: 234}, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.false;
        done();
      });
    });

    it('should send back false when domain.administrator is not equal to user._id', function(done) {
      mockery.registerMock('mongoose', {model: function() {}});

      var ObjectId = require('bson').ObjectId;
      var domain = require(this.testEnv.basePath + '/backend/core/domain');
      domain.userIsDomainAdministrator({_id: new ObjectId()}, {_id: 123, administrator: new ObjectId()}, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.false;
        done();
      });
    });

    it('should send back false true domain.administrator is equal to user._id', function(done) {
      mockery.registerMock('mongoose', {model: function() {}});

      var ObjectId = require('bson').ObjectId;
      var id = new ObjectId();
      var domain = require(this.testEnv.basePath + '/backend/core/domain');
      domain.userIsDomainAdministrator({_id: id}, {_id: 123, administrator: id}, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.true;
        done();
      });
    });
  });

  describe('userIsDomainMember fn', function() {
    it('should send back error when user is undefined', function(done) {
      mockery.registerMock('mongoose', {model: function() {}});

      var domain = require(this.testEnv.basePath + '/backend/core/domain');
      domain.userIsDomainMember(null, {_id: 123}, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back error when user._id is undefined', function(done) {
      mockery.registerMock('mongoose', {model: function() {}});

      var domain = require(this.testEnv.basePath + '/backend/core/domain');
      domain.userIsDomainMember({}, {_id: 123}, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back error when domain is undefined', function(done) {
      mockery.registerMock('mongoose', {model: function() {}});

      var domain = require(this.testEnv.basePath + '/backend/core/domain');
      domain.userIsDomainMember({_id: 123}, null, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back error when domain._id is undefined', function(done) {
      mockery.registerMock('mongoose', {model: function() {}});

      var domain = require(this.testEnv.basePath + '/backend/core/domain');
      domain.userIsDomainMember({_id: 123}, {}, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back true when user is domain administrator', function(done) {
      mockery.registerMock('mongoose', {model: function() {}});

      var ObjectId = require('bson').ObjectId;
      var id = new ObjectId();
      var domain = require(this.testEnv.basePath + '/backend/core/domain');
      domain.userIsDomainMember({_id: id}, {_id: 123, administrator: id}, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.true;
        done();
      });
    });

    it('should send back false when user.domains is undefined', function(done) {
      mockery.registerMock('mongoose', {model: function() {}});

      var ObjectId = require('bson').ObjectId;
      var domain = require(this.testEnv.basePath + '/backend/core/domain');
      domain.userIsDomainMember({_id: new ObjectId()}, {_id: 123, administrator: new ObjectId()}, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.false;
        done();
      });
    });

    it('should send back false when user.domains is empty', function(done) {
      mockery.registerMock('mongoose', {model: function() {}});

      var ObjectId = require('bson').ObjectId;
      var domain = require(this.testEnv.basePath + '/backend/core/domain');
      domain.userIsDomainMember({_id: new ObjectId(), domains: []}, {_id: 123, administrator: new ObjectId()}, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.false;
        done();
      });
    });

    it('should send back true when user.domains contains the domain', function(done) {
      mockery.registerMock('mongoose', {model: function() {}});

      var ObjectId = require('bson').ObjectId;
      var domain = require(this.testEnv.basePath + '/backend/core/domain');
      var domain_id = new ObjectId();

      domain.userIsDomainMember({_id: new ObjectId(), domains: [{domain_id: new ObjectId()}, {domain_id: domain_id}, {domain_id: new ObjectId()}]}, {_id: domain_id, administrator: new ObjectId()}, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.true;
        done();
      });
    });

    it('should send back false when user.domains does not contain the domain', function(done) {
      mockery.registerMock('mongoose', {model: function() {}});

      var ObjectId = require('bson').ObjectId;
      var domain = require(this.testEnv.basePath + '/backend/core/domain');
      var domain_id = new ObjectId();

      domain.userIsDomainMember({_id: new ObjectId(), domains: [{domain_id: new ObjectId()}, {domain_id: new ObjectId()}]}, {_id: domain_id, administrator: new ObjectId()}, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.false;
        done();
      });
    });
  });
});
