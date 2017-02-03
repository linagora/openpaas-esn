'use strict';

const EXPORTED_SYMBOLS = ['Utils'];

/////

const Cu = Components.utils;

Cu.import('resource://gre/modules/Services.jsm');
Cu.import('resource://op-tb-autoconf/modules/Log.jsm');

/////

class Utils {
  constructor(logger) {
    this.logger = logger;
  }

  find(arrayOrEnumerator, iid, match, primaryKey) {
    let enumerator = arrayOrEnumerator.enumerate ? arrayOrEnumerator.enumerate() : arrayOrEnumerator;

    enumeration: while (enumerator.hasMoreElements()) {
      let server = enumerator.getNext().QueryInterface(iid),
          key = primaryKey ? server[primaryKey] : server.key;

      this.logger.info('Matching ' + iid + ' ${key} against ${match}', { match, key});

      for (let key in match) {
        if (match.hasOwnProperty(key)) {
          if (match[key] !== server[key]) {
            this.logger.debug('Property ${key} value ${actual} does not match ${expected}', { key, actual: server[key], expected: match[key] });

            continue enumeration;
          }
        }
      }

      this.logger.info('Returning matching ' + iid + ': ${key}', { key });

      return server;
    }

    return null;
  }

  copyProperties(source, destination, context) {
    Object.keys(source).forEach(key => {
      let value = source[key];

      // Perform variable substitution against the context, if any
      if (context && typeof value === 'string') {
        value = value.replace(/%(.*)%/, (match, property) => context[property] || match);
      }

      this.logger.debug('Setting property ${key} to ${value}', {key, value});

      try {
        destination[key] = value;
      } catch (e) {
        this.logger.error('Could not set property ${key}: ${e}', { key, e });
      }
    });

    return destination;
  }

  newURI(uri) {
    return Services.io.newURI(uri, 'utf-8', null);
  }

  omit(object, properties) {
    if (!properties) {
      return object;
    }

    let copy = {},
        props = Array.isArray(properties) ? properties : [properties];

    for (let key in object) {
      if (props.indexOf(key) === -1 && object.hasOwnProperty(key)) {
        copy[key] = object[key];
      }
    }

    return copy;
  }

  restartWithPrompt() {
    let strBundle = Services.strings.createBundle('chrome://op-tb-autoconf/locale/op-tb-autoconf.properties');

    if (Services.prompt.confirm(null, strBundle.GetStringFromName('restart.title'), strBundle.GetStringFromName('restart.text'))) {
      this.logger.info('About to restart Thunderbird');

      Services.startup.quit(Services.startup.eForceQuit | Services.startup.eRestart);
    }
  }
}
