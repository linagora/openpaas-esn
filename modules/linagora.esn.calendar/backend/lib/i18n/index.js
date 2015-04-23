'use strict';

var AwesomeModule = require('awesome-module');

var AwesomeI18n = new AwesomeModule('linagora.esn.calendar.i18n', {
  dependencies: [],
  states: {
    lib: function(dependencies, callback) {
      var i18n = require('i18n');
      i18n.configure(
        {
          defaultLocale: 'en',
          locales: ['en', 'fr', 'vi'],
          directory: __dirname + '/locales',
          updateFiles: false,
          indent: '  ',
          extension: '.json',
          cookie: 'locale'
        }
      );

      return callback(null, i18n);
    }
  },
  abilities: ['i18n']
});

module.exports = AwesomeI18n;
