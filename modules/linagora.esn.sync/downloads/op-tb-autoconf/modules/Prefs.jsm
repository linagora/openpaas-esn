'use strict';

const EXPORTED_SYMBOLS = ['Prefs'];

/////

const Cu = Components.utils;

Cu.import('resource://gre/modules/Preferences.jsm');
Cu.import('resource://op-tb-autoconf/modules/Log.jsm');

/////

const logger = getLogger('Prefs');

const Prefs = {

  setupPreferences: function(prefs) {
    prefs.forEach(pref => {
      if (Preferences.isSet(pref.name)) {
        let currentValue = Preferences.get(pref.name);

        if (!pref.overwrite && currentValue !== pref.value) {
          return logger.debug('Not overwriting pref ' + pref.name + ' current value ${currentValue}', { currentValue });
        }
      }

      Prefs.set(pref.name, pref.value);
    });
  },

  get: Preferences.get.bind(Preferences),

  set: function(key, value) {
    logger.info('Setting pref ${key} to ${value}', { key, value });

    Preferences.set(key, value);
  }

};
