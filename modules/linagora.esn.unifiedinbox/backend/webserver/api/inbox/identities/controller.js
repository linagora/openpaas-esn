'use strict';

const q = require('q'),
      ejs = require('ejs'),
      _ = require('lodash'),
      DEFAULT_IDENTITY = require('./default-identity.json');

module.exports = dependencies => {
  const esnConfig = dependencies('esn-config'),
        i18n = dependencies('i18n');

  return {
    getDefaultIdentity
  };

  /////

  function getDefaultIdentity(req, res) {
    const user = req.user,
          __ = phrase => i18n.__({ locale: req.getLocale(), phrase });

    q.all([
      esnConfig('identities.default').inModule('linagora.esn.unifiedinbox').forUser(user).get(),
      esnConfig('identities.default').inModule('linagora.esn.unifiedinbox').forUser(user, true).get()
    ])
      .then(configs => _.extend(configs[0] || DEFAULT_IDENTITY, configs[1]))
      .then(identity => ejs.render(JSON.stringify(identity), { user, __ }))
      .then(
        identity => res.status(200).json(JSON.parse(identity)),
        err => res.status(500).send(`Failed to generate default identity for ${user.id}. ${err}`)
      );
  }
};
