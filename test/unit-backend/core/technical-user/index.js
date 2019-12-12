const { expect } = require('chai');
const mockery = require('mockery');
const sinon = require('sinon');

let technicalUserModule;

const TechnicalUser = class {
  constructor(user) {
    this.user = user;
    this.save = () => {};
  }
};

const authToken = function() {
  return {
    getNewToken: () => {}
  };
};

describe('The technical user tests', function() {
  beforeEach(function() {
    this.helpers.mock.models({
      TechnicalUser
    });

    mockery.registerMock('../auth/token', authToken);
    technicalUserModule = this.helpers.requireBackend('core/technical-user');
  });

  describe('get function tests', function() {
    it('should call findOne once', function(done) {
      const id = '123';

      const result = { foo: 'bar' };

      TechnicalUser.findOne = sinon.spy(function(query, callback) {
        expect(query).to.deep.equal({ _id: id });
        callback(null, result);
      });

      technicalUserModule.get(id, (err, user) => {
        expect(err).to.not.exist;
        expect(user).to.deep.equal(result);
        expect(TechnicalUser.findOne).to.have.been.calledOnce;
        done();
      });
    });
  });

  describe('getNewToken function tests', function() {
    it('should call authToken.getNewToken once', function(done) {
      const technicalUser = {_id: 123 };
      const ttl = 'abc';
      const user_type = 'technical';

      const expectedParams = {
        ttl,
        user: technicalUser._id,
        user_type
      };

      const resultToken = { foo: 'bar' };

      authToken.getNewToken = sinon.spy(function(params, callback) {
        expect(params).to.deep.equal(expectedParams);
        callback(null, resultToken);
      });

      technicalUserModule.getNewToken(technicalUser, ttl, (err, result) => {
        expect(err).to.not.exist;
        expect(result).to.deep.equal(resultToken);
        expect(authToken.getNewToken).to.have.been.calledOnce;
        done();
      });
    });
  });

  describe('deleteById function tests', function() {
    it('should call findByIdAndDelete once', function(done) {
      const userId = '123';

      TechnicalUser.findByIdAndDelete = sinon.spy(function(id, callback) {
        expect(id).to.equal(userId);
        callback(null);
      });

      technicalUserModule.deleteById(userId, err => {
        expect(err).to.not.exist;
        expect(TechnicalUser.findByIdAndDelete).to.have.been.calledOnce;
        done();
      });
    });
  });

  describe('findByType function tests', function() {
    const type = 'dav';
    const result = { foo: 'bar' };

    it('should call find once', function(done) {
      TechnicalUser.find = sinon.spy(function(query, callback) {
        expect(query).to.deep.equal({type: type});
        callback(null, result);
      });

      technicalUserModule.findByType(type, (err, technicalUsers) => {
        expect(err).to.not.exist;
        expect(technicalUsers).to.deep.equal(result);
        expect(TechnicalUser.find).to.have.been.calledOnce;
        done();
      });
    });
  });

  describe('findByTypeAndDomain function tests', function() {
    it('should call find once', function(done) {
      const type = 'dav';
      const domain = 'abc';
      const result = { foo: 'bar' };

      TechnicalUser.find = sinon.spy(function(query, callback) {
        expect(query).to.deep.equal({type: type, domain: domain});
        callback(null, result);
      });

      technicalUserModule.findByTypeAndDomain(type, domain, (err, technicalUsers) => {
        expect(err).to.not.exist;
        expect(technicalUsers).to.deep.equal(result);
        expect(TechnicalUser.find).to.have.been.calledOnce;
        done();
      });
    });
  });

  describe('add function tests', function() {
    it('should keep technicalUser param to be instance of TechnicalUser model', function() {
      const user = new TechnicalUser('JAMES');

      user.save = sinon.spy(function(callback) {
        callback(null);
      });

      technicalUserModule.add(user, err => {
        expect(err).to.not.exist;
        expect(user).to.be.instanceOf(TechnicalUser);
        expect(user.save).to.have.been.called;
      });
    });

    it('should cast (technicalUser param) from instance of other class to instance of TechnicalUser model', function() {
      const notTechnicalUser = {
        save: () => {}
      };

      notTechnicalUser.save = sinon.spy(function(callback) {
        callback(null);
      });

      technicalUserModule.add(notTechnicalUser, err => {
        expect(err).to.not.exist;
        expect(notTechnicalUser).to.be.instanceof(TechnicalUser);
        expect(notTechnicalUser.save).to.have.been.called;
      });
    });
  });

  describe('update function tests', function() {
    it('should call findByIdAndUpdate once', function() {
      const id = '123';

      const payload = {
        name: 'Sabre',
        description: 'foo',
        type: 'dav',
        domain: 'abc123',
        data: 'bar'
      };

      TechnicalUser.findByIdAndUpdate = sinon.spy(function(userId, updatedAttributes, callback) {
        expect(userId).to.equal(id);
        expect(updatedAttributes).to.deep.equal(payload);
        callback(null);
      });
      technicalUserModule.update(id, payload, err => {
        expect(err).to.not.exist;
        expect(TechnicalUser.findByIdAndUpdate).to.have.been.calledOnce;
      });
    });
  });
});
