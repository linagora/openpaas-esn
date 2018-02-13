'use strict';

const mockery = require('mockery');
const expect = require('chai').expect;
const sinon = require('sinon');

describe('The domain module', function() {
  describe('The create fn', function() {
    it('should publish an event on successfully created a domain', function(done) {
      const createdDomain = {
        _id: '123',
        name: 'example.com'
      };
      const domainModel = function() {
        this.save = callback => callback(null, createdDomain);
      };
      const mongooseMock = {
        model: () => domainModel
      };
      const pubsubMock = {
        local: {
          topic: name => {
            expect(name).to.equal('domain:created');

            return {
              publish: function(event) {
                expect(event.name).to.equal('domain:created');
                expect(event.objectType).to.equal('domain');
                expect(event.payload).to.equal(createdDomain);

                done();
              }
            };
          }
        }
      };

      mockery.registerMock('mongoose', mongooseMock);
      mockery.registerMock('../pubsub', pubsubMock);

      const domain = this.helpers.requireBackend('core/domain');

      domain.create();
    });
  });

  describe('The load fn', function() {
    it('should send back error when id is undefined', function(done) {
      var mongooseMock = {
        model: function() {
          return {};
        }
      };
      mockery.registerMock('mongoose', mongooseMock);
      var domain = this.helpers.requireBackend('core/domain');
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
      var domain = this.helpers.requireBackend('core/domain');
      domain.load(123, function(err) {
        expect(err).to.not.exist;
        expect(called).to.be.true;
        done();
      });
    });
  });

  describe('The userIsDomainAdministrator fn', function() {

    var domainModule;

    beforeEach(function() {
      mockery.registerMock('mongoose', {
        model: function() {}
      });

      domainModule = this.helpers.requireBackend('core/domain');
    });

    it('should send back error when user is undefined', function(done) {
      domainModule.userIsDomainAdministrator(null, {_id: 123}, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back error when user._id is undefined', function(done) {
      domainModule.userIsDomainAdministrator({}, {_id: 123}, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back error when domain is undefined', function(done) {
      domainModule.userIsDomainAdministrator({_id: 123}, null, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back error when domain._id is undefined', function(done) {
      domainModule.userIsDomainAdministrator({_id: 123}, {}, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back false when domain.administrators is undefined', function(done) {
      domainModule.userIsDomainAdministrator({_id: 123}, {_id: 234}, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.false;
        done();
      });
    });

    it('should send back false when domain.administrators does not contain user._id', function(done) {
      var ObjectId = require('bson').ObjectId;
      var user = { _id: new ObjectId() };
      var domain = { _id: 123, administrators: [{ user_id: new ObjectId() }] };

      domainModule.userIsDomainAdministrator(user, domain, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.false;
        done();
      });
    });

    it('should send back true when domain.administrators contains user._id', function(done) {
      var ObjectId = require('bson').ObjectId;
      var user = { _id: new ObjectId() };
      var domain = { _id: 123, administrators: [{ user_id: user._id }] };

      domainModule.userIsDomainAdministrator(user, domain, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.true;
        done();
      });
    });

    it('should send back true when domain.administrator is equal to user._id (deprecated)', function(done) {
      var ObjectId = require('bson').ObjectId;
      var user = { _id: new ObjectId() };
      var domain = { _id: 123, administrator: user._id, timestamps: {} };

      domainModule.userIsDomainAdministrator(user, domain, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.true;
        done();
      });
    });
  });

  describe('userIsDomainMember fn', function() {

    var domainModule;

    beforeEach(function() {
      mockery.registerMock('mongoose', {
        model: function() {}
      });

      domainModule = this.helpers.requireBackend('core/domain');
    });

    it('should send back error when user is undefined', function(done) {
      domainModule.userIsDomainMember(null, {_id: 123}, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back error when user._id is undefined', function(done) {
      domainModule.userIsDomainMember({}, {_id: 123}, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back error when domain is undefined', function(done) {
      domainModule.userIsDomainMember({_id: 123}, null, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back error when domain._id is undefined', function(done) {
      domainModule.userIsDomainMember({_id: 123}, {}, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back true when user is domain administrator', function(done) {
      var ObjectId = require('bson').ObjectId;
      var user = { _id: new ObjectId() };
      var domain = { _id: 123, administrators: [{ user_id: user._id }] };

      domainModule.userIsDomainMember(user, domain, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.true;
        done();
      });
    });

    it('should send back false when user.domains is undefined', function(done) {
      var ObjectId = require('bson').ObjectId;

      domainModule.userIsDomainMember({_id: new ObjectId()}, {_id: 123}, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.false;
        done();
      });
    });

    it('should send back false when user.domains is empty', function(done) {
      var ObjectId = require('bson').ObjectId;

      domainModule.userIsDomainMember({_id: new ObjectId(), domains: []}, {_id: 123}, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.false;
        done();
      });
    });

    it('should send back true when user.domains contains the domain', function(done) {
      var ObjectId = require('bson').ObjectId;
      var domain_id = new ObjectId();
      var user = {
        _id: new ObjectId(),
        domains: [
          {domain_id: new ObjectId()},
          {domain_id: domain_id},
          {domain_id: new ObjectId()}
        ]
      };

      domainModule.userIsDomainMember(user, {_id: domain_id}, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.true;
        done();
      });
    });

    it('should send back false when user.domains does not contain the domain', function(done) {
      var ObjectId = require('bson').ObjectId;
      var domain_id = new ObjectId();
      var user = {
        _id: new ObjectId(),
        domains: [{domain_id: new ObjectId()}, {domain_id: new ObjectId()}]
      };

      domainModule.userIsDomainMember(user, {_id: domain_id}, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.false;
        done();
      });
    });
  });

  describe('getByName fn', function() {
    let domainModule, modelMock;

    beforeEach(function() {
      modelMock = {};

      mockery.registerMock('mongoose', {
        model: function() {
          return modelMock;
        }
      });

      domainModule = this.helpers.requireBackend('core/domain');
    });

    it('should find a domain by name', function() {
      const domainName = 'a domain name';

      modelMock.findOne = sinon.spy();
      domainModule.getByName(domainName);

      expect(modelMock.findOne).to.have.been.calledWith({ name: domainName });
    });
  });
});
