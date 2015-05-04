'use strict';

var noop = function() {};
/**
 *
 * @return {{log: Function, warn: Function, error: Function, debug: Function, info: Function}}
 */
module.exports = {
  log: noop,
  warn: noop,
  error: noop,
  debug: noop,
  info: noop
};
