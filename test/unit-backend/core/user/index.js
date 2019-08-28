'use strict';

const q = require('q');
const expect = require('chai').expect;
const mockery = require('mockery');
const sinon = require('sinon');

describe('The user core module', function() {
  var mockModels, mockEsnConfig;

  beforeEach(function() {
    mockModels = this.helpers.mock.models;
    mockEsnConfig = this.helpers.mock.esnConfig;
    mockery.registerMock('../auth/token', {getNewToken: function() {}});
    mockery.registerMock('./login', {});
    mockery.registerMock('./moderation', {});
  });

  describe('recordUser method', function() {
    var User = null;
    var userModule = null;

    beforeEach(function() {
      User = function User(user) {
        this.name = user.name;
        this.emails = ['email1@domain.com', 'email2@domain.com'];
      };
      User.prototype.save = function(callback) {
        callback();
      };
      mockModels({
        User: User
      });
    });

    it('should callback with error if some emails of user are already in use', function(done) {
      mockery.registerMock('../availability', {
        email: {
          isAvailable() {
            return q.resolve(false);
          }
        }
      });

      userModule = this.helpers.requireBackend('core').user;
      userModule.recordUser({
        name: 'aName'
      }, (err, createdUser) => {
        expect(err.message).to.equal('Emails already in use: email1@domain.com, email2@domain.com');
        expect(createdUser).to.not.exist;
        done();
      });
    });

    it('should callback with error when it cannot check availability of user emails', function(done) {
      mockery.registerMock('../availability', {
        email: {
          isAvailable() {
            return q.reject(new Error('an_error'));
          }
        }
      });

      userModule = this.helpers.requireBackend('core').user;
      userModule.recordUser({
        name: 'aName'
      }, (err, createdUser) => {
        expect(err.message).to.equal('an_error');
        expect(createdUser).to.not.exist;
        done();
      });
    });

    it('should save a user if it is not an instance of User model', function(done) {
      mockery.registerMock('../../core/pubsub', {
        local: {
          topic: function() {
            return {
              publish: function() {}
            };
          }
        }
      });
      userModule = this.helpers.requireBackend('core').user;
      userModule.recordUser({name: 'aName'}, function() {
        done();
      });
    });

    it('should save a user if it is an instance of User model', function(done) {
      mockery.registerMock('../../core/pubsub', {
        local: {
          topic: function() {
            return {
              publish: function() {}
            };
          }
        }
      });
      userModule = this.helpers.requireBackend('core').user;
      userModule.recordUser(new User({name: 'aName'}), function() {
        done();
      });
    });

    it('should publish an event in the userCreated topic', function(done) {
      var CONSTANTS = require('../../../../backend/core/user/constants');
      var spy = sinon.spy();
      mockery.registerMock('../../core/pubsub', {
        local: {
          topic: function(name) {
            expect(name).to.equal(CONSTANTS.EVENTS.userCreated);

            return {
              publish: spy
            };
          }
        }
      });
      userModule = this.helpers.requireBackend('core').user;
      userModule.recordUser(new User({name: 'aName'}), function(err) {
        expect(err).to.not.exist;
        expect(spy).to.have.been.called;
        done();
      });
    });
  });

  describe('provisionUser method', () => {
    let User, Pubsub, userModule, template;

    beforeEach(function() {
      User = function User(user) {
        this.emails = user.emails;
        this._id = user._id;
        this.firstname = user.firstname;
        this.lastname = user.lastname;
      };
      User.prototype.save = function(callback) {
        this._id = 12345;
        callback(null, this);
      };
      Pubsub = function() {};
      Pubsub.prototype.topic = () => ({
        publish: () => {},
        subscribe: () => {}
      });

      mockEsnConfig(callback => callback(null, template));
      mockModels({ User: User });
      mockery.registerMock('../pubsub', Pubsub);
      mockery.registerMock('../../core/pubsub', {
        local: {
          topic: () => ({
            publish: () => {}
          })
        }
      });

      userModule = this.helpers.requireBackend('core/user');
      template = this.helpers.requireFixture('user-template').simple();
    });

    it('should record user without user template defined', function(done) {
      template = null;

      userModule.provisionUser({emails: ['test@linagora.com']}, (err, user) => {
        if (err) return done(err);

        try {
          expect(user).to.exist;
          expect(user._id).to.exist;
          expect(user.emails).to.exist;
          expect(user.emails).to.be.an.array;
          expect(user.emails).to.have.length(1);
          expect(user.emails[0]).to.equal('test@linagora.com');
          expect(user.firstname).to.be.undefined;
          expect(user.lastname).to.be.undefined;
        } catch (error) {
          return done(error);
        }

        done();
      });
    });

    it('should record a user with the template informations', function(done) {
      userModule.provisionUser({emails: ['test@linagora.com']}, (err, user) => {
        if (err) return done(err);

        try {
          expect(user).to.exist;
          expect(user._id).to.exist;
          expect(user.emails).to.exist;
          expect(user.emails).to.be.an.array;
          expect(user.emails).to.have.length(1);
          expect(user.emails[0]).to.equal('test@linagora.com');
          expect(user.firstname).to.equal('John');
          expect(user.lastname).to.equal('Doe');
        } catch (error) {
          return done(error);
        }

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

    it('should lowercase the email array and flatten it into an $or array', function(done) {
      userModule.findByEmail(['Test@linagora.com', 'tESt2@linagora.com'], function(err, query) {
        expect(query).to.deep.equal({
          $or: [
            {
              accounts: {
                $elemMatch: {
                  emails: 'test@linagora.com'
                }
              }
            },
            {
              accounts: {
                $elemMatch: {
                  emails: 'test2@linagora.com'
                }
              }
            }
          ]
        });

        done();
      });
    });

    it('should lowercase a single email', function(done) {
      userModule.findByEmail('Test@linagora.com', function(err, query) {
        expect(query).to.deep.equal({
          accounts: {
            $elemMatch: {
              emails: 'test@linagora.com'
            }
          }
        });

        done();
      });
    });
  });

  describe('findUsersByEmail method', function() {
    let userModule;

    beforeEach(function() {
      const User = {
        find: function(query, callback) {
          callback(null, query);
        }
      };
      mockModels({
        User
      });
      userModule = this.helpers.requireBackend('core').user;
    });

    it('should lowercase the email array and flatten it into an $or array', function(done) {
      userModule.findUsersByEmail(['Test@linagora.com', 'tESt2@linagora.com'], (err, query) => {
        expect(query).to.deep.equal({
          $or: [
            {
              accounts: {
                $elemMatch: {
                  emails: 'test@linagora.com'
                }
              }
            },
            {
              accounts: {
                $elemMatch: {
                  emails: 'test2@linagora.com'
                }
              }
            }
          ]
        });

        done();
      });
    });

    it('should lowercase a single email', function(done) {
      userModule.findUsersByEmail('Test@linagora.com', (err, query) => {
        expect(query).to.deep.equal({
          accounts: {
            $elemMatch: {
              emails: 'test@linagora.com'
            }
          }
        });

        done();
      });
    });
  });

  describe('The update fn', function() {
    let getModule;
    let localPubsubMock;
    let constants;

    beforeEach(function() {
      mockModels({
        User: {}
      });

      localPubsubMock = {};

      mockery.registerMock('../../core/pubsub', {
        local: localPubsubMock
      });

      constants = this.helpers.requireBackend('core/user/constants');

      getModule = () => this.helpers.requireBackend('core').user;
    });

    it('should call callback with error and updated user object', function() {
      const err = new Error('some_error');
      const updatedUser = { _id: 1 };
      const user = {
        save(callback) {
          callback(err, updatedUser);
        }
      };
      const callbackSpy = sinon.spy();

      getModule().update(user, callbackSpy);

      expect(callbackSpy).to.have.been.calledOnce;
      expect(callbackSpy).to.have.been.calledWith(err, updatedUser);
    });

    it('should publish userUpdated event when user was updated successfully with new data (rowAffected > 0)', function() {
      const err = null;
      const updatedUser = { _id: 1 };
      const rowAffected = 1;
      const user = {
        save(callback) {
          callback(err, updatedUser, rowAffected);
        }
      };
      const callback = () => {};
      const publishSpy = sinon.spy();
      const topicStub = sinon.stub().returns({
        publish: publishSpy
      });

      localPubsubMock.topic = topicStub;

      getModule().update(user, callback);

      expect(topicStub).to.have.been.calledOnce;
      expect(topicStub).to.have.been.calledWith(constants.EVENTS.userUpdated);
      expect(publishSpy).to.have.been.calledOnce;
      expect(publishSpy).to.have.been.calledWith(updatedUser);
    });

    it('should not publish event when user was not updated successfully', function() {
      const err = new Error('some_error');
      const updatedUser = { _id: 1 };
      const rowAffected = 1;
      const user = {
        save(callback) {
          callback(err, updatedUser, rowAffected);
        }
      };
      const callback = () => {};
      const publishSpy = sinon.spy();
      const topicStub = sinon.stub().returns({
        publish: publishSpy
      });

      localPubsubMock.topic = topicStub;

      getModule().update(user, callback);

      expect(topicStub).to.not.have.been.called;
      expect(publishSpy).to.not.have.been.called;
    });
  });

  describe('updateProfile fn', function() {
    var userModule = null;
    var profile = {};

    beforeEach(function() {

      var User = {
        findOneAndUpdate: function(query, profile, opt, callback) {
          callback(query, profile);
        }
      };
      mockModels({
        User: User
      });
      userModule = this.helpers.requireBackend('core').user;
    });

    it('should send back an error when user is undefined', function(done) {
      userModule.updateProfile(null, profile, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back an error when profile is undefined', function(done) {
      userModule.updateProfile('1223', null, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should pass directly user if user_id is not set', function(done) {
      userModule.updateProfile('1234', profile, function(query) {
        expect(query).to.deep.equal({ _id: '1234'});
        done();
      });
    });

    it('should pass directly user_id otherwise', function(done) {
      userModule.updateProfile({ _id: '1235'}, profile, function(query) {
        expect(query).to.deep.equal({ _id: '1235'});
        done();
      });
    });
  });

  describe('The removeAccountById fn', function() {
    var userModule, User;

    beforeEach(function() {
      User = {
        markModified: sinon.spy(),
        save: function(callback) {
          expect(User.markModified).to.have.been.calledWith('accounts');
          callback();
        },
        accounts: [
          { data: { id: 1 } },
          { data: { id: 2 } },
          { data: { id: 3 } }
        ]
      };

      mockModels({
        User: User
      });
      userModule = this.helpers.requireBackend('core').user;
    });

    it('should save user if account exists', function(done) {
      User.save = function() {
        done();
      };
      userModule.removeAccountById(User, 1);
    });

    it('should call callback fn without error if saved user correctly', function(done) {
      userModule.removeAccountById(User, 1, done);
    });

    it('should call callback fn with error if can not save user', function(done) {
      var error = {
        name: 'Mongo error',
        message: 'Can not save'
      };

      User.save = function(callback) {
        callback(error);
      };

      userModule.removeAccountById(User, 1, function(err) {
        expect(err).to.deep.equal(error);
        done();
      });
    });

    it('should call callback fn with account not found error if account does not exist', function(done) {
      userModule.removeAccountById(User, 4, function(err) {
        expect(err).to.deep.equal(new Error('Invalid account id: 4'));
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

  describe('list function', function() {

    it('should call mongoose#find', function(done) {
      var User = {
        find: function(callback) {
          callback();
        }
      };
      mockModels({
        User: User
      });
      var userModule = this.helpers.requireBackend('core').user;
      userModule.list(done);
    });
  });

  describe('The listByCursor function', function() {
    it('should return cursor object', function() {
      const cursorMock = { next: function() {} };

      const User = {
        find: function() {
          return { cursor: function() { return cursorMock; } };
        }
      };

      mockModels({
        User: User
      });

      const userModule = this.helpers.requireBackend('core').user;
      const cursor = userModule.listByCursor();

      expect(cursor).to.equal(cursorMock);
    });
  });

  describe('The translate fn', function() {
    let getModule;

    beforeEach(function() {
      mockModels({
        User: {}
      });

      getModule = () => this.helpers.requireBackend('core').user;
    });

    it('should translate payload user to OpenPaaS user', function() {
      const payload = {
        username: 'user@email',
        user: {
          name: 'Alice'
        },
        mapping: {
          firsname: 'name'
        },
        domainId: 'domain123'
      };
      const expectedUser = {
        firsname: payload.user.name,
        accounts: [{
          type: 'email',
          hosted: true,
          emails: [payload.username]
        }],
        domains: [{
          domain_id: payload.domainId
        }]
      };

      expect(getModule().translate(null, payload)).to.deep.equal(expectedUser);
    });

    it('should add domain to based user if it is not included', function() {
      const payload = {
        username: 'user@email',
        user: {
          name: 'Alice'
        },
        mapping: {
          firsname: 'name'
        },
        domainId: 'domain123'
      };
      const baseUser = {
        domains: [{
          domain_id: 'domain456'
        }]
      };
      const expectedUser = {
        firsname: payload.user.name,
        accounts: [{
          type: 'email',
          hosted: true,
          emails: [payload.username]
        }],
        domains: [{
          domain_id: 'domain456'
        }, {
          domain_id: payload.domainId
        }]
      };

      expect(getModule().translate(baseUser, payload)).to.deep.equal(expectedUser);
    });

    it('should not domain to based user if it is already included', function() {
      const payload = {
        username: 'user@email',
        user: {
          name: 'Alice'
        },
        mapping: {
          firsname: 'name'
        },
        domainId: 'domain123'
      };
      const baseUser = {
        domains: [{
          domain_id: payload.domainId
        }]
      };
      const expectedUser = {
        firsname: payload.user.name,
        accounts: [{
          type: 'email',
          hosted: true,
          emails: [payload.username]
        }],
        domains: [{
          domain_id: payload.domainId
        }]
      };

      expect(getModule().translate(baseUser, payload)).to.deep.equal(expectedUser);
    });

    it('should not add null domain to based user', function() {
      const payload = {
        username: 'user@email',
        user: {
          name: 'Alice'
        },
        mapping: {
          firsname: 'name'
        },
        domainId: null
      };
      const baseUser = {
        domains: [{
          domain_id: 'domain123'
        }]
      };
      const expectedUser = {
        firsname: payload.user.name,
        accounts: [{
          type: 'email',
          hosted: true,
          emails: [payload.username]
        }],
        domains: [{
          domain_id: 'domain123'
        }]
      };

      expect(getModule().translate(baseUser, payload)).to.deep.equal(expectedUser);
    });

    it('should add email to based user account if it is not included', function() {
      const payload = {
        username: 'user@email',
        user: {
          name: 'Alice'
        },
        mapping: {
          firsname: 'name'
        },
        domainId: 'domain123'
      };
      const baseUser = {
        accounts: [{
          type: 'email',
          hosted: true,
          emails: ['other@email']
        }]
      };
      const expectedUser = {
        firsname: payload.user.name,
        accounts: [{
          type: 'email',
          hosted: true,
          emails: ['other@email', payload.username]
        }],
        domains: [{
          domain_id: payload.domainId
        }]
      };

      expect(getModule().translate(baseUser, payload)).to.deep.equal(expectedUser);
    });

    it('should not add email to based user account if it is already included', function() {
      const payload = {
        username: 'user@email',
        user: {
          name: 'Alice'
        },
        mapping: {
          firsname: 'name'
        },
        domainId: 'domain123'
      };
      const baseUser = {
        accounts: [{
          type: 'email',
          hosted: true,
          emails: [payload.username]
        }]
      };
      const expectedUser = {
        firsname: payload.user.name,
        accounts: [{
          type: 'email',
          hosted: true,
          emails: [payload.username]
        }],
        domains: [{
          domain_id: payload.domainId
        }]
      };

      expect(getModule().translate(baseUser, payload)).to.deep.equal(expectedUser);
    });

    it('should add email to based user account if it is not included and defined in mapping', function() {
      const payload = {
        username: 'user@email',
        user: {
          name: 'Alice',
          mailAlias: 'alias@email'
        },
        mapping: {
          firsname: 'name',
          email: 'mailAlias'
        },
        domainId: 'domain123'
      };
      const baseUser = {};
      const expectedUser = {
        firsname: payload.user.name,
        accounts: [{
          type: 'email',
          hosted: true,
          emails: [payload.username, payload.user.mailAlias]
        }],
        domains: [{
          domain_id: payload.domainId
        }]
      };

      expect(getModule().translate(baseUser, payload)).to.deep.equal(expectedUser);
    });

  });

  describe('The getDisplayName function', function() {
    let getModule, user, firstname, lastname, preferredEmail;

    beforeEach(function() {
      mockModels({User: {}});
      firstname = 'John';
      lastname = 'Doe';
      preferredEmail = 'johndoe@open-paas.org';
      user = {firstname, lastname, preferredEmail};
      getModule = () => this.helpers.requireBackend('core').user;
    });

    it('should return the preferredEmail when firstname and lastname are undefined', function() {
      delete user.firsname;
      delete user.lastname;

      expect(getModule().getDisplayName(user)).to.equal(preferredEmail);
    });

    it('should return the preferredEmail when firstname is only defined', function() {
      delete user.lastname;

      expect(getModule().getDisplayName(user)).to.equal(preferredEmail);
    });

    it('should return the preferredEmail when lastname is only defined', function() {
      delete user.firstname;

      expect(getModule().getDisplayName(user)).to.equal(preferredEmail);
    });

    it('should return a valid display name when firstname and lastname are defined', function() {
      expect(getModule().getDisplayName(user)).to.equal(`${firstname} ${lastname}`);
    });
  });
});
