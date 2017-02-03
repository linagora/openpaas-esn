'use strict';

const EXPORTED_SYMBOLS = ['Passwords'];

/////

const Cu = Components.utils;
const Cc = Components.classes;
const Ci = Components.interfaces;
const CC = Components.Constructor;

Cu.import('resource://gre/modules/Services.jsm');
Cu.import('resource://gre/modules/Preferences.jsm');
Cu.import('resource://op-tb-autoconf/modules/Log.jsm');

/////

const logger = getLogger('Passwords'),
      strBundle = Services.strings.createBundle('chrome://op-tb-autoconf/locale/op-tb-autoconf.properties'),
      manager = Cc['@mozilla.org/login-manager;1'].getService(Ci.nsILoginManager),
      LoginInfo = CC('@mozilla.org/login-manager/loginInfo;1', Ci.nsILoginInfo, 'init'),
      REALM = 'ESN',
      FORM_SUBMIT_URL = 'User login';

const Passwords = {

  getCredentialsForUsername: function(username) {
    let url = Preferences.get('extensions.op.autoconf.rootUrl'),
        oldLogin = findLogin(url, username);

    if (oldLogin) {
      return oldLogin;
    }

    let login = { value: username },
        password = {};

    Services.prompt.promptUsernameAndPassword(
      null,
      strBundle.GetStringFromName('promptUsernameAndPassword.title'),
      strBundle.GetStringFromName('promptUsernameAndPassword.text'),
      login,
      password,
      null,
      {}
    );

    Passwords.storePassword(url, login.value, password.value, null, REALM); // Lightning

    return Passwords.storePassword(url, login.value, password.value, FORM_SUBMIT_URL, null); // CardBook
  },

  storePassword(url, username, password, form = null, realm = REALM) {
    if (!username || !password) {
      return logger.warn('Cannot store null username or password for ${url}', { url });
    }

    let oldLogin = findLogin(url, username, form, realm),
        login = new LoginInfo(url, form, realm, username, password, '', '');

    if (oldLogin) {
      manager.modifyLogin(oldLogin, login);
    } else {
      manager.addLogin(login);
    }

    logger.info('Successfully stored password for ${username} on ${url} using realm ${realm} and form ${form}', { username, url, form, realm });

    return login;
  }

};

/////

function findLogin(url, username, form = null, realm = REALM) {
  let logins = manager.findLogins({}, url, form, realm);

  logger.debug('There are ${count} stored passwords for ${url} using realm ${realm} and form ${form}', { count: logins.length, url, form, realm });

  for (let i = 0; i < logins.length; i++) {
    let login = logins[i];

    if (!username || (login.username === username)) {
      logger.debug('Returning found credentials for username ${username}. ${login}', { username, login });

      return login;
    }
  }

  return null;
}
