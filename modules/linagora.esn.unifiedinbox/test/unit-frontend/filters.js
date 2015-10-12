'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The Unified Inbox Angular module filters', function() {

  var $sce = {}, $filter;

  beforeEach(function() {
    angular.mock.module('esn.session');
    angular.mock.module('linagora.esn.unifiedinbox');
  });

  beforeEach(module(function($provide) {
    $provide.value('$sce', $sce);
  }));

  describe('The trustAsHtml filter', function() {

    beforeEach(inject(function(_$filter_) {
      $filter = _$filter_;
    }));

    it('should delegate to $sce', function(done) {
      var rawHtml = '<xss />';

      $sce.trustAsHtml = function(text) {
        expect(text).to.equal(rawHtml);

        done();
      };

      $filter('trustAsHtml')(rawHtml);
    });

  });

});
