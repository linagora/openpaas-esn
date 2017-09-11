'use strict';

const mockery = require('mockery');
const expect = require('chai').expect;
const sinon = require('sinon');

describe('The oauth2 module', function() {
  const client = { _id: 'c1', creator: 'u2' },
    user = { _id: 'u1' };
  let oauth2orizeMock, callback, grantCallback;

  beforeEach(function() {
    const mockModels = this.helpers.mock.models;

    mockModels({
      OAuthAuthorizationCode: {
        findOne: function() {}
      }
    });

    oauth2orizeMock = {
      createServer: () => ({
        serializeClient: () => {},
        deserializeClient: () => {},
        grant: () => {},
        token: () => {},
        exchange: () => {},
        authorization: () => {},
        decision: () => {},
        errorHandler: () => {}
      }),
      grant: {},
      exchange: {
        code: () => {}
      }
    };

    mockery.registerMock('oauth2orize', oauth2orizeMock);
  });

  it('callback function of oauth2orize.grant.code should be called with (null, false) if user is not app creator', function() {
    oauth2orizeMock.grant.code = cb => { callback = cb; };
    oauth2orizeMock.grant.token = () => {};

    this.helpers.requireBackend('oauth2');

    grantCallback = sinon.spy();
    callback(client, null, user, null, grantCallback);

    expect(grantCallback).to.have.been.calledWith(null, false);
  });

  it('callback function of oauth2orize.grant.token should be called with (null, false) if user is not app creator', function() {
    oauth2orizeMock.grant.code = () => {};
    oauth2orizeMock.grant.token = cb => { callback = cb; };

    this.helpers.requireBackend('oauth2');

    grantCallback = sinon.spy();
    callback(client, user, null, grantCallback);

    expect(grantCallback).to.have.been.calledWith(null, false);
  });

  it('dialog function should redirect to redirectURI with error=access_denied if user is not app creator', function() {
    oauth2orizeMock.grant.code = () => {};
    oauth2orizeMock.grant.token = () => {};

    const oauth2 = this.helpers.requireBackend('oauth2');

    const req = {
      user: {
        _id: 'u1'
      },
      oauth2: {
        client: {
          creator: 'u2'
        },
        redirectURI: 'http://localhost:8080/oauth/callback',
        transactionID: 'abc'
      },
      session: {
        authorize: {
          abc: {}
        }
      }
    };
    const res = {
      redirect: sinon.spy()
    };

    oauth2.dialog(req, res);

    expect(req.session.authorize[req.oauth2.transactionID]).to.be.undefined;
    expect(res.redirect).to.have.been.calledWith(`${req.oauth2.redirectURI}?error=access_denied`);
  });
});
