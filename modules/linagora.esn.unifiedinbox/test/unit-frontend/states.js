'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The Inbox states', function() {

  var $rootScope, $templateCache, $state, $modal;
  var jmapClient, hideModal;

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
    angular.mock.module('esn.previous-page');
  });

  beforeEach(function() {
    jmapClient = {
      getMailboxes: function() {
        return $q.when([{ id: '1', name: '1' }]);
      }
    };

    angular.mock.module(function($provide) {
      $provide.value('$modal', $modal = sinon.spy(function() {
        var modal = { hide: hideModal = sinon.spy() };

        return modal;
      }));
      $provide.value('withJmapClient', function(callback) {
        return callback(jmapClient);
      });
    });
  });

  beforeEach(function() {
    inject(function(_$rootScope_, _$templateCache_, _$state_) {
      $rootScope = _$rootScope_;
      $templateCache = _$templateCache_;
      $state = _$state_;

      // Mock state templates, so that an HTTP request is not made to the backend to fetch them
      mockTemplate('/unifiedinbox/views/home');
      mockTemplate('/unifiedinbox/views/composer/fullscreen-edit-form/index');
      mockTemplate('/unifiedinbox/views/configuration/index');
      mockTemplate('/unifiedinbox/views/folders/add/index');
      mockTemplate('/unifiedinbox/views/folders/edit/index');
      mockTemplate('/unifiedinbox/views/folders/delete/index');
      mockTemplate('/unifiedinbox/views/unified-inbox/index');
      mockTemplate('/unifiedinbox/views/configuration/vacation/index');
      mockTemplate('/unifiedinbox/views/email/view/index');
    });
  });

  describe('The unifiedinbox.folders.add state', function() {

    it('should open a $modal when entering the state', function() {
      goTo('unifiedinbox.inbox.folders.add', { mailbox: '1' });

      expect($modal).to.have.been.calledWith();
    });

    it('should close the modal when leaving the state', function() {
      goTo('unifiedinbox.inbox.folders.add', { mailbox: '1' });
      goTo('unifiedinbox.inbox', { mailbox: '1' });

      expect(hideModal).to.have.been.calledWith();
    });

  });

  describe('The unifiedinbox.folders.edit state', function() {

    it('should open a $modal when entering the state', function() {
      goTo('unifiedinbox.inbox.folders.edit', { mailbox: '1' });

      expect($modal).to.have.been.calledWith();
    });

    it('should close the modal when leaving the state', function() {
      goTo('unifiedinbox.inbox.folders.edit', { mailbox: '1' });
      goTo('unifiedinbox.inbox', { mailbox: '1' });

      expect(hideModal).to.have.been.calledWith();
    });

  });

  describe('The unifiedinbox.folders.edit.delete state', function() {

    it('should open a $modal when entering the state', function() {
      goTo('unifiedinbox.inbox.folders.edit.delete', { mailbox: '1' });
      goTo('unifiedinbox.inbox', { mailbox: '1' });

      expect($modal).to.have.been.calledWith();
    });

    it('should close the modal when leaving the state', function() {
      goTo('unifiedinbox.inbox.folders.edit.delete', { mailbox: '1' });
      goTo('unifiedinbox.inbox', { mailbox: '1' });

      expect(hideModal).to.have.been.calledWith();
    });

  });

  describe('The unifiedinbox.inbox.attachments.message state', function() {

    it('should hide the attachments sidebar', function() {
      goTo('unifiedinbox.inbox.attachments');

      expect($rootScope.inbox.rightSidebar.isVisible).to.equal(true);

      goTo('.message', {emailId: 'id'});

      expect($rootScope.inbox.rightSidebar.isVisible).to.equal(true);
      expect($rootScope.inbox.list.isElementOpened).to.equal(true);
      expect($rootScope.inbox.list.infiniteScrollDisabled).to.equal(true);
    });

  });

});
