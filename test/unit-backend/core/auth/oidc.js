const { expect } = require('chai');
const mockery = require('mockery');
const sinon = require('sinon');

describe('The OIDC authentication module', function() {
  let getModule;

  before(function() {
    getModule = this.helpers.requireBackend.bind(this.helpers, 'core/auth/oidc');
  });

  describe('The getUserInfo function', function() {
    let accessToken, client_secret, client_id, issuer_url, esnConfig, getConfig, openIDClient;

    beforeEach(function() {
      accessToken = 'accessToken38';
      client_id = 'openpaas';
      client_secret = 'supersecret';
      issuer_url = 'http://localhost:8888/issuer';
      getConfig = sinon.stub();
      esnConfig = sinon.stub().returns({ get: getConfig });
      openIDClient = {
        Issuer: {
          discover: sinon.stub()
        }
      };
      mockery.registerMock('../esn-config', esnConfig);
      mockery.registerMock('openid-client', openIDClient);
    });

    it('should reject when configuration is not found', function(done) {
      getConfig.returns(Promise.resolve());

      getModule().getUserInfo(accessToken)
        .then(() => done(new Error('Should not be called')))
        .catch(err => {
          expect(err.message).to.match(/OpenID Connect is not configured/);
          done();
        });
    });

    it('should reject when oidc issuer can not be discovered', function(done) {
      const oidcError = 'Error while discovering issuer';

      getConfig.returns(Promise.resolve({
        issuer_url,
        client_id,
        client_secret
      }));

      openIDClient.Issuer.discover.returns(Promise.reject(new Error(oidcError)));

      getModule().getUserInfo(accessToken)
        .then(() => done(new Error('Should not be called')))
        .catch(err => {
          expect(err.message).to.eql(oidcError);
          done();
        });
    });

    it('should send back userinfo from openid-client issuer', function(done) {
      const userinfo = 'The user info';
      const userinfoStub = sinon.stub();

      function Client() {}
      Client.prototype.userinfo = userinfoStub;

      const issuer = { Client };

      getConfig.returns(Promise.resolve({
        issuer_url,
        client_id,
        client_secret
      }));

      openIDClient.Issuer.discover.returns(Promise.resolve(issuer));
      userinfoStub.returns(Promise.resolve(userinfo));

      getModule().getUserInfo(accessToken)
        .then(info => {
          expect(openIDClient.Issuer.discover).to.have.been.calledWith(issuer_url);
          expect(info).to.eql(userinfo);
          expect(userinfoStub).to.have.been.calledWith(accessToken);
          done();
        })
        .catch(done);
    });
  });
});
