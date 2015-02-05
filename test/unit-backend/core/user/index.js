'use strict';

var expect = require('chai').expect;

describe('The user core module', function() {
  var mockModels, mockPubSub, mockEsnConfig;

  beforeEach(function() {
    mockModels = this.helpers.mock.models;
    mockPubSub = this.helpers.mock.pubsub;
    mockEsnConfig = this.helpers.mock.esnConfig;
  });

  describe('recordUser method', function() {
    var User = null;
    var userModule = null;

    beforeEach(function() {
      User = function User(user) {
        this.name = user.name;
        this.emails = ['email1', 'email2'];
      };
      User.prototype.save = function(callback) {
        callback();
      };
      mockModels({
        User: User
      });
      userModule = this.helpers.requireBackend('core').user;
    });

    it('should save a user if it is not an instance of User model', function(done) {
      userModule.recordUser({name: 'aName'}, done);
    });

    it('should also save a user if it is an instance of User model', function(done) {
      userModule.recordUser(new User({name: 'aName'}), done);
    });
  });

  describe('provisionUser method', function() {
    var User = null;
    var userModule = null;

    beforeEach(function() {
      var template = this.helpers.requireFixture('user-template').simple();

      var get = function(callback) {
        callback(null, template);
      };
      mockEsnConfig(get);
    });

    it('should record a user with the template informations', function(done) {
      User = function User(user) {
        this.emails = user.emails;
        this._id = user._id,
        this.firstname = user.firstname;
        this.lastname = user.lastname;
      };
      User.prototype.save = function(callback) {
        this._id = 12345;
        callback(null, this);
      };
      mockModels({
        User: User
      });
      userModule = this.helpers.requireBackend('core').user;
      userModule.provisionUser({emails: ['test@linagora.com']}, function(err, user) {
        expect(err).to.be.null;
        expect(user).to.exist;
        expect(user._id).to.exist;
        expect(user.emails).to.exist;
        expect(user.emails).to.be.an.array;
        expect(user.emails).to.have.length(1);
        expect(user.emails[0]).to.equal('test@linagora.com');
        expect(user.firstname).to.equal('John');
        expect(user.lastname).to.equal('Doe');
        done();
      });
    });
  });

  describe('findByEmail method', function() {
    var userModule = null;

    beforeEach(function() {
      var User = {
        findOne: function(query, callback) {
          callback(null, query);
        }
      };
      mockModels({
        User: User
      });
      userModule = this.helpers.requireBackend('core').user;
    });

    it('should lowercased the email array and flatten it into an $or array', function(done) {
      userModule.findByEmail(['Test@linagora.com', 'tESt2@linagora.com'], function(err, query) {
        expect(query).to.deep.equal({
          '$or': [
            { emails: 'test@linagora.com' },
            { emails: 'test2@linagora.com' }
          ]
        });
        done();
      });
    });

    it('should lowercased a single email', function(done) {
      userModule.findByEmail('Test@linagora.com', function(err, query) {
        expect(query).to.deep.equal({ emails: 'test@linagora.com' });
        done();
      });
    });
  });

  describe('updateProfile fn', function() {
    var userModule = null;

    beforeEach(function() {
      var User = {
        update: function(query, option, callback) {
          callback(query, option);
        }
      };
      mockModels({
        User: User
      });
      userModule = this.helpers.requireBackend('core').user;
    });

    it('should send back an error when user is undefined', function(done) {
      userModule.updateProfile(null, 'param', 'value', function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back an error when param is undefined', function(done) {
      userModule.updateProfile('1223', null, 'value', function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back an error when value is undefined', function(done) {
      userModule.updateProfile('1223', 'param', null, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should pass directly user if user_id is not set', function(done) {
      userModule.updateProfile('1234', 'param', 'value', function(query, option) {
        expect(query).to.deep.equal({ _id: '1234'});
        expect(option).to.deep.equal({
          $set: {
            'param': 'value'
          }
        });
        done();
      });
    });

    it('should pass directly user_id otherwise', function(done) {
      userModule.updateProfile({ _id: '1235'}, 'param', 'value', function(query, option) {
        expect(query).to.deep.equal({ _id: '1235'});
        expect(option).to.deep.equal({
          $set: {
            'param': 'value'
          }
        });
        done();
      });
    });
  });

  describe('belongsToCompany fn', function() {
    var userModule = null;

    beforeEach(function() {
      mockModels({
        User: {}
      });
      userModule = this.helpers.requireBackend('core').user;
    });

    it('should send back an error when user is undefined', function(done) {
      userModule.belongsToCompany(null, 'linagora.com', function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back an error when company is undefined', function(done) {
      userModule.belongsToCompany({_id: '123'}, null, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back true when user belongs to company', function(done) {
      userModule.belongsToCompany({_id: '123', emails: ['user1@linagora.com', 'user1@open-paas.org']}, 'linagora.com', function(err, isInternal) {
        expect(err).to.not.exist;
        expect(isInternal).to.be.true;
        done();
      });
    });

    it('should send back false when user does not belong to company', function(done) {
      userModule.belongsToCompany({_id: '123', emails: ['user1@linagora.com', 'user1@open-paas.org']}, 'problem.com', function(err, isInternal) {
        expect(err).to.not.exist;
        expect(isInternal).to.be.false;
        done();
      });
    });
  });

});
