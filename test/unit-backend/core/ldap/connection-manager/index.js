const { expect } = require('chai');
const mockery = require('mockery');

describe('The connection manager module', function() {
  let getModule, LdapAuthMock;
  let CachedConnectionManager;

  beforeEach(function() {
    LdapAuthMock = function() {};

    mockery.registerMock('ldapauth-fork', LdapAuthMock);
    CachedConnectionManager = this.helpers.requireBackend('core/ldap/connection-manager/CachedConnectionManager');

    getModule = () => this.helpers.requireBackend('core/ldap/connection-manager');
  });

  it('should export an instance of CachedConnectionManager class', function() {
    const connectionManager = getModule();

    expect(connectionManager).instanceOf(CachedConnectionManager);
    expect(connectionManager.LdapAuthClient).to.deep.equal(LdapAuthMock);
  });
});
