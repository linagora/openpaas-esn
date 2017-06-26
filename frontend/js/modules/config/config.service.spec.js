'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esnConfig service', function() {

  var $rootScope, esnConfig;

  beforeEach(module('esn.configuration', function($provide) {
    $provide.value('session', {
      user: {
        configurations: {
          modules: [{
            name: 'core',
            configurations: [{
              name: 'projects',
              value: false
            }]
          }, {
            name: 'module.1',
            configurations: [{
              name: 'feature',
              value: true
            }, {
              name: 'stringFeature',
              value: 'stringValue'
            }]
          }]
        }
      },
      domain: {},
      ready: {
        then: function(callback) { return $q.when().then(callback); }
      }
    });
  }));

  beforeEach(inject(function(_$rootScope_, _esnConfig_) {
    esnConfig = _esnConfig_;
    $rootScope = _$rootScope_;
  }));

  function checkValue(key, defaultValue, expected, done) {
    esnConfig(key, defaultValue).then(function(value) {
      expect(value).to.equal(expected);

      done();
    }, done);

    $rootScope.$digest();
  }

  it('should return undefined when called with a non existing key, and no default value', function(done) {
    checkValue('not.existing.key', undefined, undefined, done);
  });

  it('should return the default value when called with a non existing key', function(done) {
    checkValue('not.existing.key', 'value', 'value', done);
  });

  it('should return the correct value when called with an existing key', function(done) {
    checkValue('module.1.feature', true, true, done);
  });

  it('should return the correct value when called with an existing key for a non boolean value', function(done) {
    checkValue('module.1.stringFeature', undefined, 'stringValue', done);
  });

  it('should return the correct value when called with an existing key and a default value', function(done) {
    checkValue('module.1.feature', 'value', true, done);
  });

});
