'use strict';

const fs = require('fs'),
      path = require('path'),
      q = require('q');

module.exports = dependencies => {
  const logger = dependencies('logger'),
    {preProcess, toHTML} = require('../../lib/guides/renderer')(dependencies);

  return {
    renderAndroidGuide
  };

  /////

  function androidGuideFile(locale) {
    return path.normalize(path.join(__dirname, '../../lib/i18n/guides/ios/' + locale + '.md'));
  }

  function readLocalizedTemplate(locale) {
    return q.nfcall(fs.readFile, androidGuideFile(locale), { encoding: 'utf-8' });
  }

  function fallbackToEnglishGuide(locale) {
    return err => {
      logger.warn(`Could not read ios guide from the filesystem using locale ${locale}. Falling back to english version`, err);

      return readLocalizedTemplate('en');
    };
  }

  function getTemplate(locale) {
    return readLocalizedTemplate(locale)
      .catch(fallbackToEnglishGuide(locale));
  }

  function renderAndroidGuide(req, res) {
    const locale = req.getLocale();

    getTemplate(locale)
      .then(preProcess(req.user))
      .then(toHTML)
      .then(
        html => res.status(200).send(html),
        err => res.status(500).json({ error: {
          code: 500,
          message: `Cannot render '${locale}' user guide`, details: err.message
        }})
      );
  }
};
