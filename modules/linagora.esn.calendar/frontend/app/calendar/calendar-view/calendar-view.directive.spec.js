'use strict';

/* global chai */

var expect = chai.expect;

describe('calendarView directive', function() {

  beforeEach(function() {
    var self = this;

    this.calendarService = {
      listCalendars: function() {
        return $q.when([]);
      }
    };

    module('jadeTemplates');
    angular.mock.module('linagora.esn.graceperiod', 'esn.calendar', 'esn.scroll', function($provide) {
      $provide.constant('calendarService', self.calendarService);
      $provide.factory('miniCalendarMobileDirective', function() { return {}; });
      $provide.factory('eventCreateButtonDirective', function() { return {}; });
      $provide.factory('uiCalendarDirective', function() { return {}; });
      $provide.factory('esnCalendarDirective', function() {
        return [];
      });
    });
  });

  beforeEach(angular.mock.inject(function(_$compile_, _$rootScope_, _elementScrollService_) {
    this.$compile = _$compile_;
    this.$rootScope = _$rootScope_;
    this.$scope = this.$rootScope.$new();
    this.elementScrollService = _elementScrollService_;
    this.$scope.uiConfig = {
      calendar: {}
    };

    this.initDirective = function(scope) {
      var element = this.$compile('<calendar-view calendarHomeId="calendarHomeId" ui-config="uiConfig"/>')(scope);

      element = this.$compile(element)(scope);
      scope.$digest();

      return element;
    };
  }));

  it('should broadcast "header:disable-scroll-listener" true', function(done) {
    this.$scope.$on('header:disable-scroll-listener', function(event, data) { // eslint-disable-line
      expect(data).to.be.true;
      done();
    });
    this.initDirective(this.$scope);
    this.$rootScope.$digest();
  });

  it('should broadcast "header:disable-scroll-listener" false on destroy', function(done) {
    this.$scope.$on('header:disable-scroll-listener', function(event, data) { // eslint-disable-line
      if (data) {
        return;
      } else {
        expect(data).to.be.false;
        done();
      }
    });
    this.initDirective(this.$scope);
    this.$rootScope.$digest();
    this.$scope.$destroy();
  });
});
