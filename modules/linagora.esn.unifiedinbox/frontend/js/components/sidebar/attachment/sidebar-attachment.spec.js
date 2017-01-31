'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The inboxListSidebarAttachmentController controller', function() {

  // Injected
  var scope, $controller;
  // Mocked
  var $stateParams;

  beforeEach(module('linagora.esn.unifiedinbox', function($provide) {
    $stateParams = {
      mailbox: 'chosenMailbox'
    };

    $provide.value('$stateParams', $stateParams);
    $provide.constant('PROVIDER_TYPES', { JMAP: 'jmap' });
  }));

  beforeEach(inject(function(_$rootScope_, _$controller_) {
    scope = _$rootScope_.$new();
    $controller = _$controller_;
  }));

  function initController() {
    var controller = $controller('inboxListSidebarAttachmentController', {});

    scope.$digest();

    return controller;
  }

  it('should set the controller', function() {
    var controller = initController();

    expect(controller.mailbox).to.equal('chosenMailbox');
    expect(controller.providerType).to.equal('jmap');
  });
});
