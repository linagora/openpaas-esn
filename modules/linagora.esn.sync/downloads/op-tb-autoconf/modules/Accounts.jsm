'use strict';

const EXPORTED_SYMBOLS = ['Accounts'];

/////

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import('resource://op-tb-autoconf/modules/Log.jsm');
Cu.import('resource://op-tb-autoconf/modules/Utils.jsm');
Cu.import('resource://op-tb-autoconf/modules/Passwords.jsm');

/////

const logger = getLogger('Accounts'),
      utils = new Utils(logger),
      manager = Cc['@mozilla.org/messenger/account-manager;1'].getService(Ci.nsIMsgAccountManager),
      smtpService = Cc['@mozilla.org/messengercompose/smtp;1'].getService(Ci.nsISmtpService);

const Accounts = {

  setupAccounts: function(accountSpecs) {
    accountSpecs.forEach(accountSpec => {
      let smtpServer = createOrUpdateSmtpServer(accountSpec.smtp),
          imapServer =  createOrUpdateImapServer(accountSpec.imap),
          account = createOrUpdateAccount(imapServer);

      accountSpec.identities.forEach(identitySpec => {
        let identity = utils.find(account.identities, Ci.nsIMsgIdentity, { identityName: identitySpec.identityName });

        if (!identity) {
          logger.info('About to create a new identity for IMAP server ' + imapServer.key);

          identity = manager.createIdentity();
          identity.smtpServerKey = smtpServer.key;

          account.addIdentity(identity);
        }

        utils.copyProperties(identitySpec, identity, imapServer);
      });
    });
  }

};

/////

function storeServerPassword(server) {
  let uri = server.serverURI,
      username = server.username,
      password = Passwords.getCredentialsForUsername(username).password;

  server.password = password;
  Passwords.storePassword(uri, username, password);

  return server;
}

function createOrUpdateSmtpServer(smtp) {
  let server = utils.find(smtpService.servers, Ci.nsISmtpServer, { hostname: smtp.hostname });

  if (!server) {
    logger.info('About to create a new SMTP server');

    server = smtpService.createServer();
  }

  return storeServerPassword(utils.copyProperties(smtp, server));
}

function createOrUpdateImapServer(imap) {
  let server = utils.find(manager.allServers, Ci.nsIMsgIncomingServer, { realHostName: imap.hostName, username: imap.username });

  if (!server) {
    logger.info('About to create a new IMAP server');

    server = manager.createIncomingServer(imap.username, imap.hostName, 'imap');
  }

  return storeServerPassword(utils.copyProperties(imap, server));
}

function createOrUpdateAccount(imapServer) {
  let account = manager.FindAccountForServer(imapServer);

  if (!account) {
    logger.info('About to create a new account for IMAP server ' + imapServer.key);

    account = manager.createAccount();
    account.incomingServer = imapServer;
  }

  return account;
}
