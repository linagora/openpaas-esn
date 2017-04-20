'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The inboxMLConfig factory', function() {

  var $rootScope, inboxMLConfig;

  beforeEach(module('linagora.esn.unifiedinbox.ml', function($provide) {
    $provide.value('esnConfig', function(key, defaultValue) {
      return $q.when(defaultValue);
    });
  }));

  beforeEach(inject(function(_$rootScope_, _inboxMLConfig_) {
    $rootScope = _$rootScope_;
    inboxMLConfig = _inboxMLConfig_;
  }));

  it('should return an object with all available configurations as promise groups', function(done) {
    inboxMLConfig.classification.then(function(classification) {
      expect(classification).to.deep.equal({
        enabled: false,
        minConfidence: 92,
        markItemAsReadWhenMoving: true,
        showSuggestionsFolder: true
      });

      done();
    }, done);
    $rootScope.$digest();
  });

});
