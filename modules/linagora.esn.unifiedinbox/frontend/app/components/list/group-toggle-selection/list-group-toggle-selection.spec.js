'use strict';

/* global chai: false, sinon: false */

var expect = chai.expect;

describe('The inboxListGroupToggleSelection component', function() {

  var element, group, item1, item2, item3;
  var $compile, $rootScope, $scope, inboxSelectionService, INBOX_EVENTS;

  function compileDirective(html) {
    element = angular.element(html);
    element.appendTo(document.body);

    $compile(element)($scope = $rootScope.$new());
    $scope.$digest();

    return element;
  }

  afterEach(function() {
    if (element) {
      element.remove();
    }
  });

  beforeEach(function() {
    module('jadeTemplates');
    module('linagora.esn.unifiedinbox');
  });

  beforeEach(inject(function(_$compile_, _$rootScope_, _inboxSelectionService_, _INBOX_EVENTS_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    inboxSelectionService = _inboxSelectionService_;
    INBOX_EVENTS = _INBOX_EVENTS_;

    inboxSelectionService.toggleItemSelection = sinon.spy(inboxSelectionService.toggleItemSelection);
  }));

  beforeEach(function() {
    group = {};
    item1 = { group: group, id: 1, selectable: true };
    item2 = { group: group, id: 2 };
    item3 = { group: group, id: 3, selectable: true };

    $rootScope.group = group;
    $rootScope.elements = [item1, item2, item3];
  });

  it('should select all selectable elements on click', function() {
    var element = compileDirective('<inbox-list-group-toggle-selection group="group" elements="elements" />');

    element.children().first().click();

    expect(inboxSelectionService.toggleItemSelection).to.have.been.calledWith(item1, true);
    expect(inboxSelectionService.toggleItemSelection).to.have.been.calledWith(item3, true);
  });

  it('should update group.selected on ITEM_SELECTION_CHANGED event', function() {
    compileDirective('<inbox-list-group-toggle-selection group="group" elements="elements" />');

    item1.selected = true;
    item3.selected = true;
    $rootScope.$broadcast(INBOX_EVENTS.ITEM_SELECTION_CHANGED);

    expect(group.selected).to.equal(true);
  });

  it('should unselect all selectable elements when they are all selected on click', function() {
    compileDirective('<inbox-list-group-toggle-selection group="group" elements="elements" />');

    item1.selected = true;
    item3.selected = true;
    $rootScope.$broadcast(INBOX_EVENTS.ITEM_SELECTION_CHANGED);

    element.children().first().click();

    expect(inboxSelectionService.toggleItemSelection).to.have.been.calledWith(item1, false);
    expect(inboxSelectionService.toggleItemSelection).to.have.been.calledWith(item3, false);
  });

  it('should be visible when initialized over at least 1 selectable item', function() {
    compileDirective('<inbox-list-group-toggle-selection group="group" elements="elements" />');

    expect(element.find(':visible')).to.have.length(1);
  });

  it('should not be visible when initialized over no items', function() {

    compileDirective('<inbox-list-group-toggle-selection group="group" />');

    expect(element.find(':visible')).to.have.length(0);
  });

  it('should not be visible when initialized over unselectable items', function() {
    $rootScope.elements = [item2];

    compileDirective('<inbox-list-group-toggle-selection group="group" elements="elements" />');

    expect(element.find(':visible')).to.have.length(0);
  });

});
