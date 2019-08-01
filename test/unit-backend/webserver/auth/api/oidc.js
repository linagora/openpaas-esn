const mockery = require('mockery');
const sinon = require('sinon');
const { expect } = require('chai');

describe('The OIDC passport strategy', function() {
  describe('The oidcCallback', function() {
    let module, user, oidcModule, userModule, accessToken;

    beforeEach(function() {
      accessToken = 'accessToken1978';
      user = { email: 'chamerling@open-paas.org' };
      oidcModule = { getUserInfo: sinon.stub() };
      userModule = { findByEmail: sinon.stub() };

      mockery.registerMock('../../../core/auth/oidc', oidcModule);
      mockery.registerMock('../../../core/user', userModule);
    });

    beforeEach(function() {
      module = this.helpers.requireBackend('webserver/auth/api/oidc');
    });

    it('should call the passport callback with (null, false, message) when user info rejects', function(done) {
      oidcModule.getUserInfo.returns(Promise.reject(new Error('I failed')));

      module.oidcCallback(accessToken, (err, result, message) => {
        expect(err).to.not.exist;
        expect(result).to.be.false;
        expect(message.message).to.match(/Can not validate OpenID Connect accessToken/);
        expect(oidcModule.getUserInfo).to.have.been.calledWith(accessToken);
        expect(userModule.findByEmail).to.not.have.been.called;
        done();
      });
    });

    it('should call the passport callback with (null, false) when user info does not contain email', function(done) {
      oidcModule.getUserInfo.returns(Promise.resolve({}));

      module.oidcCallback(accessToken, (err, result) => {
        expect(err).to.not.exist;
        expect(result).to.be.false;
        expect(oidcModule.getUserInfo).to.have.been.calledWith(accessToken);
        expect(userModule.findByEmail).to.not.have.been.called;
        done();
      });
    });

    it('should call the passport callback with (null, false) when user is not found from email', function(done) {
      oidcModule.getUserInfo.returns(Promise.resolve(user));
      userModule.findByEmail.yields(null, null);

      module.oidcCallback(accessToken, (err, result) => {
        expect(err).to.not.exist;
        expect(result).to.be.false;
        expect(oidcModule.getUserInfo).to.have.been.calledWith(accessToken);
        expect(userModule.findByEmail).to.have.been.calledWith(user.email);
        done();
      });
    });

    it('should call the passport callback with (null, false) when user resolution by email fails', function(done) {
      oidcModule.getUserInfo.returns(Promise.resolve(user));
      userModule.findByEmail.yields(new Error('I failed to get the user'));

      module.oidcCallback(accessToken, (err, result) => {
        expect(err).to.not.exist;
        expect(result).to.be.false;
        expect(oidcModule.getUserInfo).to.have.been.calledWith(accessToken);
        expect(userModule.findByEmail).to.have.been.calledWith(user.email);
        done();
      });
    });

    it('should call the passport callback with (null, user) when user is found from OIDC userinfo', function(done) {
      const opUser = { _id: 1 };

      oidcModule.getUserInfo.returns(Promise.resolve(user));
      userModule.findByEmail.yields(null, opUser);

      module.oidcCallback(accessToken, (err, result) => {
        expect(err).to.not.exist;
        expect(result).to.eql(opUser);
        expect(oidcModule.getUserInfo).to.have.been.calledWith(accessToken);
        expect(userModule.findByEmail).to.have.been.calledWith(user.email);
        done();
      });
    });
  });
});
