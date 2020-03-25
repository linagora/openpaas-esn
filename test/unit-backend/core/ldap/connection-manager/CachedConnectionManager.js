const { expect } = require('chai');
const sinon = require('sinon');

describe('The CachedConnectionManager class', function() {
  let cachedConnectionManagerInstance, ldapAuthMock, connectMock;

  beforeEach(function() {
    ldapAuthMock = {
      close: sinon.spy()
    };
    connectMock = sinon.spy();
    const ldapAuthClientMock = function(ldapConf) {
      connectMock(ldapConf);

      return ldapAuthMock;
    };

    const CachedConnectionManager = this.helpers.requireBackend('core/ldap/connection-manager/CachedConnectionManager');

    cachedConnectionManagerInstance = new CachedConnectionManager(ldapAuthClientMock);
  });

  describe('The close method', function() {
    it('should do nothing if there is no cache for the given ldap URL', function() {
      cachedConnectionManagerInstance.close('notCachedUrl');

      expect(ldapAuthMock.close).to.not.have.been.called;
    });
    it('should close and clear a cache for the given ldap URL', function() {
      const ldapConf = {
        url: 'ldap://foo:389'
      };

      cachedConnectionManagerInstance.get(ldapConf);
      cachedConnectionManagerInstance.close(ldapConf.url);

      expect(ldapAuthMock.close).to.have.been.calledOnce;

      cachedConnectionManagerInstance.get(ldapConf);
      expect(connectMock).to.have.been.calledTwice; // 1 time at the beginning and 1 time to ensure one more connect after clearing the cache
    });
  });

  describe('The get method', function() {
    it('should throw error if there is no given ldap URL', function() {
      expect(() => cachedConnectionManagerInstance.get({})).to.throw(Error, 'LDAP server URL is required');
    });

    it('should create a new connection and cache it when there is no cache connection for the given ldap configuraion', function() {
      const ldapConf = { url: 'ldap://foo:389' };

      cachedConnectionManagerInstance.get(ldapConf);
      cachedConnectionManagerInstance.get(ldapConf);

      expect(connectMock).to.have.been.calledWith(ldapConf);
      expect(connectMock).to.have.been.calledOnce;
    });

    it('should return the cached connection', function() {
      const ldapConf = { url: 'ldap://foo:389' };
      const cachedConnection = cachedConnectionManagerInstance.get(ldapConf);

      expect(cachedConnectionManagerInstance.get(ldapConf)).to.deep.equal(cachedConnection);
      expect(connectMock).to.have.been.calledWith(ldapConf);
    });

    describe('When the configuration of the cached connection has changed', function() {
      const ldapConf = {
        url: 'ldap://foo:389',
        adminDn: 'adminDn',
        adminPassword: 'adminPassword',
        searchFilter: 'searchFilter',
        searchBase: 'searchBase'
      };

      it('should close the cached connection and create a new one if ldap URL has changed', function() {
        const modifiedConf = {
          ...ldapConf,
          url: 'ldap://bar:389'
        };

        cachedConnectionManagerInstance.get(ldapConf);
        cachedConnectionManagerInstance.get(modifiedConf);

        expect(connectMock).to.have.been.calledTwice;
        expect(connectMock).to.have.been.calledWith(ldapConf);
        expect(connectMock).to.have.been.calledWith(modifiedConf);
      });

      it('should close the cached connection and create a new one if ldap adminDn has changed', function() {
        const modifiedConf = {
          ...ldapConf,
          adminDn: 'modifiedAdminDn'
        };

        cachedConnectionManagerInstance.get(ldapConf);
        cachedConnectionManagerInstance.get(modifiedConf);

        expect(connectMock).to.have.been.calledTwice;
        expect(connectMock).to.have.been.calledWith(ldapConf);
        expect(connectMock).to.have.been.calledWith(modifiedConf);
      });

      it('should close the cached connection and create a new one if ldap adminPassword has changed', function() {
        const modifiedConf = {
          ...ldapConf,
          adminPassword: 'modifiedAdminPassword'
        };

        cachedConnectionManagerInstance.get(ldapConf);
        cachedConnectionManagerInstance.get(modifiedConf);

        expect(connectMock).to.have.been.calledTwice;
        expect(connectMock).to.have.been.calledWith(ldapConf);
        expect(connectMock).to.have.been.calledWith(modifiedConf);
      });

      it('should close the cached connection and create a new one if ldap searchFilter has changed', function() {
        const modifiedConf = {
          ...ldapConf,
          searchFilter: 'modifiedSearchFilter'
        };

        cachedConnectionManagerInstance.get(ldapConf);
        cachedConnectionManagerInstance.get(modifiedConf);

        expect(connectMock).to.have.been.calledTwice;
        expect(connectMock).to.have.been.calledWith(ldapConf);
        expect(connectMock).to.have.been.calledWith(modifiedConf);
      });

      it('should close the cached connection and create a new one if ldap searchBase has changed', function() {
        const modifiedConf = {
          ...ldapConf,
          searchBase: 'modifiedSearchBase'
        };

        cachedConnectionManagerInstance.get(ldapConf);
        cachedConnectionManagerInstance.get(modifiedConf);

        expect(connectMock).to.have.been.calledTwice;
        expect(connectMock).to.have.been.calledWith(ldapConf);
        expect(connectMock).to.have.been.calledWith(modifiedConf);
      });
    });
  });
});
