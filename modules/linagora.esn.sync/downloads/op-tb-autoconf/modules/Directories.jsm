'use strict';

const EXPORTED_SYMBOLS = ['Directories'];

/////

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import('resource://op-tb-autoconf/modules/Prefs.jsm');
Cu.import('resource://op-tb-autoconf/modules/Log.jsm');
Cu.import('resource://op-tb-autoconf/modules/Utils.jsm');

/////

const logger = getLogger('Dirs'),
      manager = Cc['@mozilla.org/abmanager;1'].getService(Ci.nsIAbManager),
      utils = new Utils(logger);

const Directories = {

  setupDirectories: function(directories) {
    directories.forEach(directory => {
      let dirName = directory.dirName,
          book = Directories.find(dirName);

      if (!book) {
        logger.info('About to create a new LDAP address book ${}', { directory });

        manager.newAddressBook(dirName, directory.uri, /* LDAP */ 0);
        book = Directories.find(dirName);
      }

      utils.copyProperties(utils.omit(directory, 'uri'), book.QueryInterface(Ci.nsIAbLDAPDirectory));
    });

    defineAutocompletePreferences(directories);
  },

  find: function(dirName) {
    return utils.find(manager.directories, Ci.nsIAbDirectory, { dirName }, 'dirName');
  }

};

/////

function defineAutocompletePreferences(directories) {
  Prefs.set('ldap_2.autoComplete.useDirectory', true);
  Prefs.set('ldap_2.autoComplete.directoryServer', directories.map(directory => 'ldap_2.servers.' + directory.dirName).join(','));
}
