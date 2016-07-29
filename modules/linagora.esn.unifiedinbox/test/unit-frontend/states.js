'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The Inbox states', function() {

  var $rootScope, $templateCache, $state, $modal;
  var jmapClient, hideModal;
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
    jmapClient = {
      getMailboxes: function() {
        return $q.when([{ id: '1', name: '1' }]);
      }
    };

    angular.mock.module(function($provide) {
      $provide.value('$modal', $modal = sinon.spy(function() {
        return { hide: hideModal = sinon.spy() };
      }));
      $provide.value('withJmapClient', function(callback) {
        return callback(jmapClient);
      });
    });
  });

  beforeEach(function() {
    inject(function(_$rootScope_, _$templateCache_, _$state_,
                    _HEADER_VISIBILITY_EVENT_, _HEADER_DISABLE_SCROLL_LISTENER_EVENT_) {
      $rootScope = _$rootScope_;
      $templateCache = _$templateCache_;
      $state = _$state_;

      HEADER_VISIBILITY_EVENT = _HEADER_VISIBILITY_EVENT_;
      HEADER_DISABLE_SCROLL_LISTENER_EVENT = _HEADER_DISABLE_SCROLL_LISTENER_EVENT_;

      // Mock state templates, so that an HTTP request is not made to the backend to fetch them
      mockTemplate('/unifiedinbox/views/home');
      mockTemplate('/unifiedinbox/views/composer/fullscreen-edit-form/index');
      mockTemplate('/unifiedinbox/views/configuration/index');
      mockTemplate('/unifiedinbox/views/configuration/folders/index');
      mockTemplate('/unifiedinbox/views/configuration/folders/edit/index');
      mockTemplate('/unifiedinbox/views/configuration/folders/delete/index');
    });
  });

  describe('The unifiedinbox.compose.recipients state', function() {

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

  describe('The unifiedinbox.configuration.folders.folder.delete state', function() {

    it('should open a $modal when entering the state', function() {
      goTo('unifiedinbox.configuration.folders.folder.delete', { mailbox: '1' });

      expect($modal).to.have.been.calledWith();
    });

    it('should close the modal when leaving the state', function() {
      goTo('unifiedinbox.configuration.folders.folder.delete', { mailbox: '1' });
      goTo('unifiedinbox.configuration.folders.folder', { mailbox: '1' });

      expect(hideModal).to.have.been.calledWith();
    });

  });

});
