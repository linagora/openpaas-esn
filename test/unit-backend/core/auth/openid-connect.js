const { expect } = require('chai');
const mockery = require('mockery');
const sinon = require('sinon');

describe('The openid-connect authentication module', function() {
  let getModule;

  before(function() {
    getModule = this.helpers.requireBackend.bind(this.helpers, 'core/auth/openid-connect');
  });

  describe('The getUserInfo function', function() {
    let accessToken, client_secret, client_id, issuer_url, esnConfig, getConfig, openIDClient, jsonwebtoken;

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
      jsonwebtoken = {
        decode: sinon.stub()
      };
      mockery.registerMock('../esn-config', esnConfig);
      mockery.registerMock('openid-client', openIDClient);
      mockery.registerMock('jsonwebtoken', jsonwebtoken);
    });

    it('should reject when access token can not be decoded', function(done) {
      jsonwebtoken.decode.throws(new Error('I can not decode'));

      getModule().getUserInfo(accessToken)
        .then(() => done(new Error('Should not be called')))
        .catch(err => {
          expect(err.message).to.match(/Cannot decode access token/);
          done();
        });
    });

    it('should reject when access token does not contain "azp"', function(done) {
      jsonwebtoken.decode.returns({ notazp: 1 });

      getModule().getUserInfo(accessToken)
        .then(() => done(new Error('Should not be called')))
        .catch(err => {
          expect(err.message).to.match(/ClientID was not found in access token/);
          done();
        });
    });

    it('should reject when oidc configuration is not defined', function(done) {
      jsonwebtoken.decode.returns({ azp: client_id });
      getConfig.returns(Promise.resolve());

      getModule().getUserInfo(accessToken)
        .then(() => done(new Error('Should not be called')))
        .catch(err => {
          expect(err.message).to.match(/OpenID Connect is not configured/);
          done();
        });
    });

    it('should reject when oidc configuration clients are not defined', function(done) {
      jsonwebtoken.decode.returns({ azp: client_id });
      getConfig.returns(Promise.resolve({}));

      getModule().getUserInfo(accessToken)
        .then(() => done(new Error('Should not be called')))
        .catch(err => {
          expect(err.message).to.match(/OpenID Connect is not configured/);
          done();
        });
    });

    it('should reject when oidc configuration clients are empty', function(done) {
      jsonwebtoken.decode.returns({ azp: client_id });
      getConfig.returns(Promise.resolve({ clients: [] }));

      getModule().getUserInfo(accessToken)
        .then(() => done(new Error('Should not be called')))
        .catch(err => {
          expect(err.message).to.match(/OpenID Connect is not configured/);
          done();
        });
    });

    it('should reject when oidc configuration clients does not contain current client', function(done) {
      jsonwebtoken.decode.returns({ azp: client_id });
      getConfig.returns(Promise.resolve({ clients: [{ client_id: `not${client_id}` }] }));

      getModule().getUserInfo(accessToken)
        .then(() => done(new Error('Should not be called')))
        .catch(err => {
          expect(err.message).to.match(/OpenID Connect is not configured for client/);
          done();
        });
    });

    it('should reject when oidc issuer can not be discovered', function(done) {
      const oidcError = 'Error while discovering issuer';

      jsonwebtoken.decode.returns({ azp: client_id });
      getConfig.returns(Promise.resolve({
        issuer_url,
        clients: [
          {
            client_id,
            client_secret
          }
        ]
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
        clients: [
          {
            client_id,
            client_secret
          }
        ]
      }));

      openIDClient.Issuer.discover.returns(Promise.resolve(issuer));
      jsonwebtoken.decode.returns({ azp: client_id });
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

    it('should send back userinfo from openid-client issuer when defined in token "aud"', function(done) {
      const userinfo = 'The user info';
      const userinfoStub = sinon.stub();

      function Client() {}
      Client.prototype.userinfo = userinfoStub;

      const issuer = { Client };

      getConfig.returns(Promise.resolve({
        issuer_url,
        clients: [
          {
            client_id,
            client_secret
          }
        ]
      }));

      openIDClient.Issuer.discover.returns(Promise.resolve(issuer));
      jsonwebtoken.decode.returns({ aud: client_id });
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

    it('should send back userinfo from openid-client issuer defined in client', function(done) {
      const userinfo = 'The user info';
      const clientIssuer = `${issuer_url}/another`;
      const userinfoStub = sinon.stub();

      function Client() {}
      Client.prototype.userinfo = userinfoStub;

      const issuer = { Client };

      getConfig.returns(Promise.resolve({
        issuer_url,
        clients: [
          {
            issuer_url: clientIssuer,
            client_id,
            client_secret
          }
        ]
      }));

      openIDClient.Issuer.discover.returns(Promise.resolve(issuer));
      jsonwebtoken.decode.returns({ azp: client_id });
      userinfoStub.returns(Promise.resolve(userinfo));

      getModule().getUserInfo(accessToken)
        .then(info => {
          expect(openIDClient.Issuer.discover).to.have.been.calledWith(clientIssuer);
          expect(info).to.eql(userinfo);
          expect(userinfoStub).to.have.been.calledWith(accessToken);
          done();
        })
        .catch(done);
    });
  });
});
