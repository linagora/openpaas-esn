'use strict';

var chai = require('chai');
var mockery = require('mockery');
var expect = chai.expect;

describe('The JWT API strategy', function() {

  var userModule;

  beforeEach(function() {
    mockery.registerMock('../../../core/user', userModule = {
      findByEmail: () => {}
    });
  });

  describe('The verify callback', function() {

    var verify;

    beforeEach(function() {
      verify = this.helpers.requireBackend('webserver/auth/api/jwt').strategy._verify;
    });

    it('should fail when there is no sub in payload', function(done) {
      verify({}, (err, user, options) => {
        expect(err).to.equal(null);
        expect(user).to.equal(false);
        expect(options).to.deep.equal({ message: 'sub is required in the JWT payload' });

        done();
      });
    });

    it('should fail when user could not be loaded', function(done) {
      userModule.findByEmail = (email, callback) => callback(new Error());

      verify({ sub: 'me' }, (err, user, options) => {
        expect(err).to.be.a('error');
        expect(user).to.equal(undefined);
        expect(options).to.equal(undefined);

        done();
      });
    });

    it('should fail when user is not found', function(done) {
      userModule.findByEmail = (email, callback) => callback(null, null);

      verify({ sub: 'me' }, (err, user, options) => {
        expect(err).to.equal(null);
        expect(user).to.equal(false);
        expect(options).to.equal(undefined);

        done();
      });
    });

    it('should succeed when everything is alright', function(done) {
      userModule.findByEmail = (email, callback) => callback(null, { _id: 'id' });

      verify({ sub: 'me' }, (err, user, options) => {
        expect(err).to.equal(null);
        expect(user).to.deep.equal({ _id: 'id' });
        expect(options).to.equal(undefined);

        done();
      });
    });

  });

});
