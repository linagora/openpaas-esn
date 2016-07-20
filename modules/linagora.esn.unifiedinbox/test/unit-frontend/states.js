'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The Inbox states', function() {

  var $rootScope, $templateCache, $state;
  var HEADER_VISIBILITY_EVENT, HEADER_DISABLE_SCROLL_LISTENER_EVENT;

  function mockTemplate(templateUri) {
    $templateCache.put(templateUri, '');
  }

  function goTo(state, params) {
    $state.go(state, params);
    $rootScope.$digest();
  }

  beforeEach(function() {
    angular.mock.module('esn.core');
    angular.mock.module('jadeTemplates');
    angular.mock.module('linagora.esn.unifiedinbox');
  });

  beforeEach(function() {
    inject(function(_$rootScope_, _$templateCache_, _$state_, _HEADER_VISIBILITY_EVENT_, _HEADER_DISABLE_SCROLL_LISTENER_EVENT_) {
      $rootScope = _$rootScope_;
      $templateCache = _$templateCache_;
      $state = _$state_;

      HEADER_VISIBILITY_EVENT = _HEADER_VISIBILITY_EVENT_;
      HEADER_DISABLE_SCROLL_LISTENER_EVENT = _HEADER_DISABLE_SCROLL_LISTENER_EVENT_;

      // Mock state templates, so that an HTTP request is not made to the backend to fetch them
      mockTemplate('/unifiedinbox/views/home');
      mockTemplate('/unifiedinbox/views/composer/fullscreen-edit-form/index');
    });
  });

  it('should broadcast HEADER_VISIBILITY_EVENT=false when entering unifiedinbox.compose.recipients', function(done) {
    $rootScope.$on(HEADER_VISIBILITY_EVENT, function(event, visible) {
      expect(visible).to.equal(false);

      done();
    });

    goTo('unifiedinbox.compose.recipients', { recipientsType: 'to' });
  });

  it('should broadcast HEADER_VISIBILITY_EVENT=true when leaving unifiedinbox.compose.recipients', function(done) {
    goTo('unifiedinbox.compose.recipients', { recipientsType: 'cc' });

    $rootScope.$on(HEADER_VISIBILITY_EVENT, function(event, visible) {
      expect(visible).to.equal(true);

      done();
    });

    goTo('unifiedinbox');
  });

  it('should broadcast HEADER_DISABLE_SCROLL_LISTENER_EVENT=true when entering unifiedinbox.compose.recipients', function(done) {
    $rootScope.$on(HEADER_DISABLE_SCROLL_LISTENER_EVENT, function(event, disabled) {
      expect(disabled).to.equal(true);

      done();
    });

    goTo('unifiedinbox.compose.recipients', { recipientsType: 'to' });
  });

  it('should broadcast HEADER_DISABLE_SCROLL_LISTENER_EVENT=false when leaving unifiedinbox.compose.recipients', function(done) {
    goTo('unifiedinbox.compose.recipients', { recipientsType: 'cc' });

    $rootScope.$on(HEADER_DISABLE_SCROLL_LISTENER_EVENT, function(event, disabled) {
      expect(disabled).to.equal(false);

      done();
    });

    goTo('unifiedinbox');
  });

});
