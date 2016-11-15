'use strict';

const q = require('q'),
      ejs = require('ejs'),
      esnConfig = require('../../core/esn-config');

function getConstantFrom(constants) {
  return (key, defaultValue) => {
    if (constants && typeof constants[key] !== 'undefined') {
      return constants[key];
    }

    return defaultValue;
  };
}

function constants(req, res) {
  esnConfig('constants').inModule('core').forUser(req.user).get()
    .then(constants => q.ninvoke(ejs, 'renderFile', 'templates/js/constants.ejs', { getConstant: getConstantFrom(constants) }))
    .then(
      file => res.status(200).send(file),
      err => res.status(500).send('Failed to generate constants file. ' + err)
    );
}

module.exports = {
  constants
};
