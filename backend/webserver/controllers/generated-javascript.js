'use strict';

const q = require('q'),
      ejs = require('ejs'),
      esnConfig = require('../../core/esn-config'),
      assets = require('../../core').assets,
      logger = require('../../core').logger;

const jsAppCache = new Map(),
      jsCache = new Map();

function getConstantFrom(constants) {
  return (key, defaultValue) => {
    if (constants && typeof constants[key] !== 'undefined') {
      return constants[key];
    }

    return defaultValue;
  };
}

function constants(req, res) {
  q.all([
    esnConfig('constants').inModule('core').forUser(req.user).get(),
    esnConfig('login').inModule('core').get()
  ]).spread((constants = {}, loginConfig) => {
    constants.RESET_PASSWORD_ENABLED = loginConfig && loginConfig.resetpassword;

    return q.ninvoke(ejs, 'renderFile', 'templates/js/constants.ejs', { getConstant: getConstantFrom(constants) });
  }).then(
    file => res.status(200).send(file),
    err => res.status(500).send('Failed to generate constants file. ' + err)
  );
}

function makeJsMiddleware(label, cache) {
  return function js(req, res) {
    const appName = req.params.appName,
          namespace = req.params.namespace,
          codeUniqId = `${appName}/${namespace}`;

    const cacheCodePromise = cache.get(codeUniqId);

    if (cacheCodePromise) {
      return _answer(cacheCodePromise);
    }

    const newCacheCodePromise = assets.prepareJsFiles(label, appName, namespace);

    cache.set(codeUniqId, newCacheCodePromise);

    _answer(newCacheCodePromise);

    function _answer(cachePromise) {
      cachePromise.then(code => {
        res.type('application/javascript');

        return res.end(code);
      })
      .catch(err => {
        logger.error('Unable to transpile code', err);

        return res.status(500).end(err.message || err);
      }).done();
    }
  };
}

module.exports = {
  constants,
  jsApp: makeJsMiddleware('jsApp', jsAppCache),
  js: makeJsMiddleware('js', jsCache)
};
