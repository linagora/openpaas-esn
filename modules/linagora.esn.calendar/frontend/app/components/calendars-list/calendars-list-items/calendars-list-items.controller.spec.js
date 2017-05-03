'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('the calendarsListItems controller', function() {
  var $controller, CalendarsListItemsController, calendarUniqueId, $stateMock;

  beforeEach(function() {
    calendarUniqueId = '123';

    $stateMock = {
      go: sinon.spy()
    };

    angular.mock.module('esn.calendar');

    angular.mock.module(function($provide) {
      $provide.value('$state', $stateMock);
    });

    angular.mock.inject(function(_$controller_) {
      $controller = _$controller_;
    });
  });

  beforeEach(function() {
    CalendarsListItemsController = $controller('CalendarsListItemsController');

    CalendarsListItemsController.$onInit();
  });

  describe('goTo function', function() {

    it('should call $state.go with calendarUniqueId', function() {
      CalendarsListItemsController.stateToGo = 'calendar.edit';

      CalendarsListItemsController.goTo(calendarUniqueId);

      expect($stateMock.go).to.have.been.calledWith(CalendarsListItemsController.stateToGo, { calendarUniqueId: calendarUniqueId });
    });
  });
});
