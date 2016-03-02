'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esn.configuration Angular module', function() {

  var esnConfig;

  beforeEach(module('esn.configuration', function($provide) {
    $provide.value('session', {
      user: {
        features: {
          modules: [{
            name: 'core',
            features: [{
              name: 'projects',
              value: false
            }]
          }, {
            name: 'module.1',
            features: [{
              name: 'feature',
              value: true
            }, {
              name: 'stringFeature',
              value: 'stringValue'
            }]
          }]
        }
      },
      ready: {
        then: function(callback) { callback(); }
      }
    });
  }));

  beforeEach(inject(function(_esnConfig_) {
    esnConfig = _esnConfig_;
  }));

  describe('The esnConfig factory', function() {

    it('should return undefined when called with a non existing key, and no default value', function() {
      expect(esnConfig('not.existing.key')).to.equal(undefined);
    });

    it('should return the default value when called with a non existing key', function() {
      expect(esnConfig('not.existing.key', 'value')).to.equal('value');
    });

    it('should return the correct value when called with an existing key', function() {
      expect(esnConfig('module.1.feature')).to.equal(true);
    });

    it('should return the correct value when called with an existing key for a non boolean value', function() {
      expect(esnConfig('module.1.stringFeature')).to.equal('stringValue');
    });

    it('should return the correct value when called with an existing key and a default value', function() {
      expect(esnConfig('module.1.feature', 'value')).to.equal(true);
    });

  });

});
