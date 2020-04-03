const LDAP_CONNECTING_OPTIONS = ['url', 'adminDn', 'adminPassword', 'searchFilter', 'searchBase'];

class CachedConnectionManager {
  constructor(LdapAuthClient) {
    this.LdapAuthClient = LdapAuthClient;

    this.cachedConnections = {};
  }

  get(ldapConf) {
    const { url } = ldapConf;

    if (!url) {
      throw new Error('LDAP server URL is required');
    }

    const connection = this.cachedConnections[url] && this.cachedConnections[url].connect;

    if (!connection) {
      return this._connect(ldapConf);
    }

    if (_isConnectingOptionsChanged(this.cachedConnections[url].config, ldapConf)) {
      this.close(url);

      return this._connect(ldapConf);
    }

    return connection;
  }

  close(ldapUrl) {
    if (!this.cachedConnections[ldapUrl]) {
      return;
    }

    this.cachedConnections[ldapUrl].connect.close(() => {});
    this.cachedConnections[ldapUrl] = null;

    return;
  }

  _connect(ldapConf) {
    const connection = new this.LdapAuthClient(ldapConf);

    this.cachedConnections[ldapConf.url] = {
      connect: connection,
      config: ldapConf
    };

    return connection;
  }
}

function _isConnectingOptionsChanged(oldConfig, currentConfig) {
  return LDAP_CONNECTING_OPTIONS.some(option => oldConfig[option] !== currentConfig[option]);
}

module.exports = CachedConnectionManager;
