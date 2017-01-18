'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The calInboxInvitationMessageIndicator component', function() {

  var $compile, $rootScope, scope, element;

  function initDirective() {
    element = $compile('<div dynamic-directive="inbox-message-indicators" />')(scope);
    scope.$digest();
  }

  beforeEach(function() {
    module('esn.calendar');
    module('jadeTemplates');
  });

  beforeEach(inject(function(_$compile_, _$rootScope_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;

    scope = $rootScope.$new();
  }));

  it('should register a dynamic directive to "inbox-message-indicators"', function() {
    scope.item = {
      headers: {
        'X-MEETING-UID': '1234'
      }
    };
    initDirective();

    expect(element.find('cal-inbox-invitation-message-indicator')).to.have.length(1);
  });

  it('should not be injected if there is no item in scope', function() {
    initDirective();

    expect(element.find('cal-inbox-invitation-message-indicator')).to.have.length(0);
  });

  it('should not be injected if item has no headers', function() {
    scope.item = {};
    initDirective();

    expect(element.find('cal-inbox-invitation-message-indicator')).to.have.length(0);
  });

  it('should not be injected if item has no X-MEETING-UID header', function() {
    scope.item = {
      headers: {}
    };
    initDirective();

    expect(element.find('cal-inbox-invitation-message-indicator')).to.have.length(0);
  });

});
