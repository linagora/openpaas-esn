'use strict';

const archiver = require('archiver'),
      ejs = require('ejs'),
      q = require('q');

const PREFS = 'defaults/preferences/op-tb-autoconf.js',
      EXTENSION_BASE_PATH = './modules/linagora.esn.sync/downloads/op-tb-autoconf/';

module.exports = dependencies => {
  const esnConfig = dependencies('esn-config'),
        logger = dependencies('logger');

  function downloadTBExtension(req, res) {
    const archive = archiver('zip'),
          user = req.user;

    archive.pipe(res);

    // Add everything but the preferences file...
    archive.glob('**/!(op-tb-autoconf.js)', { cwd: EXTENSION_BASE_PATH });

    // ...because we render it through ejs so that it contains proper default values
    esnConfig('web').inModule('core').forUser(user).get()
      .then(web => q.ninvoke(ejs, 'renderFile', EXTENSION_BASE_PATH + PREFS, { user, web }))
      .then(preferences => archive.append(preferences, { name: PREFS }))
      .catch(err => logger.error(`Could not complete autoconfiguration archive. ${err}`))
      .finally(() => archive.finalize());
  }

  return {
    downloadTBExtension
  };
};
