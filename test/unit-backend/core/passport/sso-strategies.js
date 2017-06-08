const mockery = require('mockery');
const sinon = require('sinon');
const expect = require('chai').expect;

describe('The core/passport/sso-strategies module', function() {

  let getModule;
  let passportMock;

  beforeEach(function() {
    getModule = () => this.helpers.requireBackend('core/passport/sso-strategies');

    passportMock = {};

    mockery.registerMock('passport', passportMock);
  });

  describe('The middleware fn', function() {

    it('should call next if the user is authenticated', function() {
      const req = {
        isAuthenticated: () => true
      };
      const res = {};
      const next = sinon.spy();

      getModule().middleware(req, res, next);

      expect(next).to.have.been.calledOnce;
    });

    it('should call next if no SSO strategies registered', function() {
      const req = {
        isAuthenticated: () => false
      };
      const res = {};
      const next = sinon.spy();

      getModule().middleware(req, res, next);

      expect(next).to.have.been.calledOnce;
    });

    it('should authenticate user by registered strategies if the user is not logged in yet', function() {
      const req = {
        isAuthenticated: () => false
      };
      const res = {};
      const next = sinon.spy();
      const authenticateSpy = sinon.spy();

      passportMock.authenticate = sinon.spy(() => authenticateSpy);
      getModule().register('facebook');
      getModule().register('twitter');

      getModule().middleware(req, res, next);

      expect(next).to.not.have.been.called;
      expect(passportMock.authenticate).to.have.been.calledWith(['facebook', 'twitter']);
      expect(authenticateSpy).to.have.been.calledWith(req, res, next);
    });

  });

});
