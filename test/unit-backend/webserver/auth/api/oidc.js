const mockery = require('mockery');
const sinon = require('sinon');
const { expect } = require('chai');

describe('The OIDC passport strategy', function() {
  describe('The oidcCallback', function() {
    let module, user, domain, domainName, oidcModule, userModule, domainModule, accessToken;

    beforeEach(function() {
      domainName = 'open-paas.org';
      accessToken = 'accessToken1978';
      user = { email: `chamerling@${domainName}` };
      domain = { id: '1', name: domainName };
      oidcModule = { getUserInfo: sinon.stub() };
      userModule = {
        findByEmail: sinon.stub(),
        provisionUser: sinon.stub(),
        translate: sinon.stub()
      };
      domainModule = {
        getByName: sinon.stub()
      };

      mockery.registerMock('../../../core/auth/oidc', oidcModule);
      mockery.registerMock('../../../core/user', userModule);
      mockery.registerMock('../../../core/domain', domainModule);
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

    it('should call the passport callback with (null, false) when user is not found from email and can not be provisioned', function(done) {
      oidcModule.getUserInfo.returns(Promise.resolve(user));
      domainModule.getByName.returns(Promise.resolve(domain));
      userModule.provisionUser.yields(new Error());
      userModule.findByEmail.yields(null, null);

      module.oidcCallback(accessToken, (err, result) => {
        expect(err).to.not.exist;
        expect(result).to.be.false;
        expect(oidcModule.getUserInfo).to.have.been.calledWith(accessToken);
        expect(userModule.findByEmail).to.have.been.calledWith(user.email);
        expect(userModule.provisionUser).to.have.been.calledOnce;
        done();
      });
    });

    it('should call the passport callback with (null, false) when domain can not be found', function(done) {
      oidcModule.getUserInfo.returns(Promise.resolve(user));
      domainModule.getByName.returns(Promise.resolve());

      module.oidcCallback(accessToken, (err, result) => {
        expect(err).to.not.exist;
        expect(result).to.be.false;
        expect(oidcModule.getUserInfo).to.have.been.calledWith(accessToken);
        expect(domainModule.getByName).to.have.been.calledWith(domainName);
        expect(userModule.provisionUser).to.not.have.been.called;
        done();
      });
    });

    it('should call the passport callback with (null, false) when domain resolution fails', function(done) {
      oidcModule.getUserInfo.returns(Promise.resolve(user));
      domainModule.getByName.returns(Promise.reject(new Error()));
      userModule.findByEmail.yields(null, null);

      module.oidcCallback(accessToken, (err, result) => {
        expect(err).to.not.exist;
        expect(result).to.be.false;
        expect(oidcModule.getUserInfo).to.have.been.calledWith(accessToken);
        expect(domainModule.getByName).to.have.been.calledWith(domainName);
        expect(userModule.provisionUser).to.not.have.been.called;
        done();
      });
    });

    it('should call the passport callback with (null, false) when user resolution by email fails', function(done) {
      oidcModule.getUserInfo.returns(Promise.resolve(user));
      domainModule.getByName.returns(Promise.resolve(domain));
      userModule.findByEmail.yields(new Error('I failed to get the user'));

      module.oidcCallback(accessToken, (err, result) => {
        expect(err).to.not.exist;
        expect(result).to.be.false;
        expect(oidcModule.getUserInfo).to.have.been.calledWith(accessToken);
        expect(domainModule.getByName).to.have.been.calledWith(domainName);
        expect(userModule.findByEmail).to.have.been.calledWith(user.email);
        done();
      });
    });

    it('should call the passport callback with (null, user) when user is found from OIDC userinfo', function(done) {
      const opUser = { _id: 1 };

      domainModule.getByName.returns(Promise.resolve(domain));
      oidcModule.getUserInfo.returns(Promise.resolve(user));
      userModule.findByEmail.yields(null, opUser);

      module.oidcCallback(accessToken, (err, result) => {
        expect(err).to.not.exist;
        expect(result).to.eql(opUser);
        expect(oidcModule.getUserInfo).to.have.been.calledWith(accessToken);
        expect(domainModule.getByName).to.have.been.calledWith(domainName);
        expect(userModule.findByEmail).to.have.been.calledWith(user.email);
        expect(userModule.provisionUser).to.not.have.been.called;
        done();
      });
    });

    it('should call the passport callback with (null, user) when user is provisioned from OIDC userinfo', function(done) {
      const opUser = { _id: 1 };

      domainModule.getByName.returns(Promise.resolve(domain));
      oidcModule.getUserInfo.returns(Promise.resolve(user));
      userModule.findByEmail.yields(null, null);
      userModule.provisionUser.yields(null, opUser);
      userModule.translate.returns(opUser);

      module.oidcCallback(accessToken, (err, result) => {
        expect(err).to.not.exist;
        expect(result).to.eql(opUser);
        expect(oidcModule.getUserInfo).to.have.been.calledWith(accessToken);
        expect(userModule.findByEmail).to.have.been.calledWith(user.email);
        expect(userModule.provisionUser).to.have.been.called;
        expect(domainModule.getByName).to.have.been.calledWith(domainName);
        done();
      });
    });

  });
});
