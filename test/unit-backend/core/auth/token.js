'use strict';

const chai = require('chai');
const expect = chai.expect;
const mockery = require('mockery');
const sinon = require('sinon');

describe('The token authentication module', function() {

  function getModel(options) {
    function AuthToken() {}
    AuthToken.prototype.save = options.save;
    AuthToken.findOne = options.findOne;

    return AuthToken;
  }

  function mongooseMock(options, done) {
    return {
      model: function(name) {
        if (name !== 'AuthToken') {
          return done(new Error('Wrong mongoose model'));
        }

        return getModel(options);
      }
    };
  }

  describe('The getNewToken function', function() {
    it('should send back error when authToken.save fails', function(done) {
      const error = new Error('Save failed');
      const saveSpy = sinon.spy(function(callback) {
        callback(error);
      });

      mockery.registerMock('mongoose', mongooseMock({save: saveSpy}, done));

      const token = this.helpers.requireBackend('core/auth/token');

      token.getNewToken(undefined, function(err) {
        expect(saveSpy).to.have.been.called;
        expect(err).to.equal(error);
        done();
      });
    });

    it('should send back a hash with token data', function(done) {
      const saveSpy = sinon.spy(function(callback) {
        callback();
      });

      mockery.registerMock('mongoose', mongooseMock({save: saveSpy}, done));

      const token = this.helpers.requireBackend('core/auth/token');

      token.getNewToken({}, function(err, options) {
        expect(saveSpy).to.have.been.called;
        expect(err).to.not.exist;
        expect(options.token).to.exist;
        expect(options.ttl).to.exist;
        expect(options.created_at).to.exist;
        done();
      });
    });
  });

  describe('The validateToken function', function() {
    it('should send false when AuthToken.findOne fails', function(done) {
      const findSpy = sinon.spy(function(token, callback) {
        callback(new Error());
      });

      mockery.registerMock('mongoose', mongooseMock({findOne: findSpy}, done));

      const token = this.helpers.requireBackend('core/auth/token');

      token.validateToken('ABC', function(result) {
        expect(findSpy).to.have.been.called;
        expect(result).to.be.false;
        done();
      });
    });

    it('should send false when AuthToken.findOne does not return data', function(done) {
      const findSpy = sinon.spy(function(token, callback) {
        callback();
      });

      mockery.registerMock('mongoose', mongooseMock({findOne: findSpy}, done));

      const token = this.helpers.requireBackend('core/auth/token');

      token.validateToken('ABC', function(result) {
        expect(findSpy).to.have.been.called;
        expect(result).to.be.false;
        done();
      });
    });

    it('should send true when AuthToken.findOne returns data', function(done) {
      const findSpy = sinon.spy(function(token, callback) {
        callback(null, {foo: 'bar'});
      });

      mockery.registerMock('mongoose', mongooseMock({findOne: findSpy}, done));

      const token = this.helpers.requireBackend('core/auth/token');

      token.validateToken('ABC', function(result) {
        expect(findSpy).to.have.been.called;
        expect(result).to.be.true;
        done();
      });
    });
  });

  describe('The getToken function', function() {
    it('should send back error when AuthToken.findOne fails', function(done) {
      const error = new Error('findOne failed');
      const findOneSpy = sinon.spy(function(token, callback) {
        callback(error);
      });

      mockery.registerMock('mongoose', mongooseMock({findOne: findOneSpy}, done));

      const token = this.helpers.requireBackend('core/auth/token');

      token.getToken('ABC', function(err) {
        expect(findOneSpy).to.have.been.called;
        expect(err).to.equal(error);
        done();
      });
    });

    it('should send back nothing when AuthToken.findOne sends back nothing', function(done) {
      const findOneSpy = sinon.spy(function(token, callback) {
        callback();
      });

      mockery.registerMock('mongoose', mongooseMock({findOne: findOneSpy}, done));

      const token = this.helpers.requireBackend('core/auth/token');

      token.getToken('ABC', function(err, token) {
        expect(err).to.not.exist;
        expect(findOneSpy).to.have.been.called;
        expect(token).to.not.exist;
        done();
      });
    });

    it('should send back token hash when AuthToken.findOne sends back data', function(done) {
      const data = {uuid: 123, foo: 'bar'};
      const findOneSpy = sinon.spy(function(token, callback) {
        callback(null, {data: data});
      });

      mockery.registerMock('mongoose', mongooseMock({findOne: findOneSpy}, done));

      const token = this.helpers.requireBackend('core/auth/token');

      token.getToken('ABC', function(err, token) {
        expect(err).to.not.exist;
        expect(findOneSpy).to.have.been.called;
        expect(token.uuid).to.deep.equals(data.uuid);
        expect(token.foo).to.deep.equals(data.foo);
        done();
      });
    });
  });
});
