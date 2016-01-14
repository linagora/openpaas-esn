'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The Unified Inbox Angular module filters', function() {

  var $sce = {}, $filter, isMobile;

  beforeEach(function() {
    angular.mock.module('esn.session');
    angular.mock.module('linagora.esn.unifiedinbox');
  });

  beforeEach(angular.mock.module(function($provide) {
    $provide.value('$sce', $sce);
    $provide.value('deviceDetector', {
      isMobile: function() { return isMobile; }
    });
  }));

  beforeEach(angular.mock.inject(function(_$filter_) {
    $filter = _$filter_;
  }));

  describe('The trustAsHtml filter', function() {
    it('should delegate to $sce', function(done) {
      var rawHtml = '<xss />';

      $sce.trustAsHtml = function(text) {
        expect(text).to.equal(rawHtml);

        done();
      };

      $filter('trustAsHtml')(rawHtml);
    });
  });

  describe('The emailer filter', function() {
    var recipient;

    it('should do nothing if the array is not defined', function() {
      expect($filter('emailer')()).to.be.undefined;
    });

    it('should return the recipient in richtext mode for desktop', function() {
      recipient = {name: '1@linagora.com', email: '1@linagora.com'};
      isMobile = false;
      expect($filter('emailer')(recipient)).to.equal('1@linagora.com &lt;1@linagora.com&gt;');
    });

    it('should return the recipient in text mode for desktop', function() {
      recipient = {name: '1@linagora.com', email: '1@linagora.com'};
      isMobile = true;
      expect($filter('emailer')(recipient)).to.equal('1@linagora.com <1@linagora.com>');
    });
  });

  describe('The emailerList filter', function() {
    var array;

    it('should do nothing if the array is not defined', function() {
      expect($filter('emailerList')()).to.be.undefined;
    });

    it('should join an array in richtext mode for desktop', function() {
      array = [{name: '1@linagora.com', email: '1@linagora.com'}, {name: '2@linagora.com', email: '2@linagora.com'}];
      isMobile = false;
      expect($filter('emailerList')(array)).to.equal('1@linagora.com &lt;1@linagora.com&gt;, 2@linagora.com &lt;2@linagora.com&gt;');
    });

    it('should be able to join an array in text mode for mobile', function() {
      array = [{name: '1@linagora.com', email: '1@linagora.com'}, {name: '2@linagora.com', email: '2@linagora.com'}];
      isMobile = true;
      expect($filter('emailerList')(array)).to.equal('1@linagora.com <1@linagora.com>, 2@linagora.com <2@linagora.com>');
    });

    it('should prefix the joined array by the given prefix', function() {
      array = [{name: '1@linagora.com', email: '1@linagora.com'}, {name: '2@linagora.com', email: '2@linagora.com'}];
      isMobile = false;
      expect($filter('emailerList')(array, 'Prefix: ')).to.equal('Prefix: 1@linagora.com &lt;1@linagora.com&gt;, 2@linagora.com &lt;2@linagora.com&gt;');
    });
  });

});
