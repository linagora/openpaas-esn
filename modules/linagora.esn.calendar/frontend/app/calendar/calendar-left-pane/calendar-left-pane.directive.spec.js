'use strict';

/* global chai: false */
var expect = chai.expect;

describe('calendarLeftPane directive', function() {
  var LEFT_PANEL_BOTTOM_MARGIN;
  var CALENDAR_EVENTS;
  var calendarServiceMock;

  beforeEach(function() {
    calendarServiceMock = {
      listCalendars: function() {
        return $q.when([]);
      }
    };

    angular.mock.module('jadeTemplates', 'linagora.esn.graceperiod', 'esn.calendar', function($provide) {
      $provide.value('calendarService', calendarServiceMock);
    });
  });

  beforeEach(angular.mock.inject(function(_$compile_, _$rootScope_, $q) {
    this.$compile = _$compile_;
    this.$rootScope = _$rootScope_;
    this.$scope = this.$rootScope.$new();
    this.$q = $q;

    this.initDirective = function(scope) {
      var element = this.$compile('<calendar-left-pane/>')(scope);

      element = this.$compile(element)(scope);
      scope.$digest();

      return element;
    };

    angular.mock.inject(function(_LEFT_PANEL_BOTTOM_MARGIN_, _CALENDAR_EVENTS_) {
      LEFT_PANEL_BOTTOM_MARGIN = _LEFT_PANEL_BOTTOM_MARGIN_;
      CALENDAR_EVENTS = _CALENDAR_EVENTS_;
    });
  }));

  it('change element height on calendar:height', function() {
    var element = this.initDirective(this.$scope);

    this.$rootScope.$broadcast(CALENDAR_EVENTS.CALENDAR_HEIGHT, 1200);
    expect(element.height()).to.equal(1200 - LEFT_PANEL_BOTTOM_MARGIN);
  });
});
