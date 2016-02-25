'use strict';

/* global chai: false */
/* global sinon: false */
var expect = chai.expect;

describe('The calendar module directives', function() {
  var self;

  beforeEach(function() {
    self = this;
    module('jadeTemplates');
    angular.mock.module('linagora.esn.graceperiod', 'esn.calendar', 'angular-nicescroll');
  });

  describe('calendarView directive', function() {
    beforeEach(function() {
      var self = this;

      this.calendarService = {
        listCalendars: function() {
          return $q.when([]);
        }
      };

      angular.mock.module('ui.calendar', function($provide) {
        $provide.constant('calendarService', self.calendarService);
        $provide.factory('miniCalendarMobileDirective', function() { return {}; });
        $provide.factory('eventCreateButtonDirective', function() { return {}; });
        $provide.factory('uiCalendarDirective', function() { return {}; });
      });
    });

    beforeEach(angular.mock.inject(function(_$compile_, _$rootScope_) {
      this.$compile = _$compile_;
      this.$rootScope = _$rootScope_;
      this.$scope = this.$rootScope.$new();
      this.$scope.uiConfig = {
        calendar: {}
      };

      this.initDirective = function(scope) {
        var element = this.$compile('<calendar-view ui-config="uiConfig"/>')(scope);
        element = this.$compile(element)(scope);
        scope.$digest();
        return element;
      };
    }));

    it('should broadcast "header:disable-scroll-listener" true', function(done) {
      this.$scope.$on('header:disable-scroll-listener', function(event, data) {
        expect(data).to.be.true;
        done();
      });
      this.initDirective(this.$scope);
    });

    it('should broadcast "header:disable-scroll-listener" false on destroy', function(done) {
      this.$scope.$on('header:disable-scroll-listener', function(event, data) {
        if (data) {
          return;
        } else {
          expect(data).to.be.false;
          done();
        }
      });
      this.initDirective(this.$scope);
      this.$scope.$destroy();
    });
  });

  describe('calendarLeftPane directive', function() {
    var LEFT_PANEL_BOTTOM_MARGIN;
    var CALENDAR_EVENTS;
    var calendarServiceMock;

    beforeEach(function() {
      calendarServiceMock = {
        listCalendars: function() {
          return self.$q.when([]);
        }
      };

      angular.mock.module('ui.calendar', function($provide) {
        $provide.constant('calendarService', calendarServiceMock);
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

  describe('autoSizeAndUpdate directive', function() {
    var autosizeSpy;
    beforeEach(function() {
      autosizeSpy = sinon.spy();
      angular.mock.module('esn.form.helper', function($provide) {
        $provide.value('autosize', autosizeSpy);
      });

      angular.mock.inject(function(_$compile_, _$rootScope_) {
        this.$compile = _$compile_;
        this.$rootScope = _$rootScope_;
        this.$scope = this.$rootScope.$new();
      });

      this.initDirective = function(scope) {
        var element = this.$compile('<div auto-size-and-update/>')(scope);
        scope.$digest();
        return element;
      };
    });

    it('should call the autosize service provided by esn.form.helper model', function() {
      this.initDirective(this.$scope);
      expect(autosizeSpy).to.be.called;
    });
  });

  describe('calendarDateIndicator directive', function() {
    beforeEach(function() {
      this.uiCalendarConfig = {
        calendars: {
          123: {
            fullCalendar: sinon.stub().returns({title: 'aDate'})
          },
          456: {
            fullCalendar: sinon.stub().returns({title: 'aMiniDate'})
          }
        }
      };

      var self = this;
      angular.mock.module('ui.calendar', function($provide) {
        $provide.value('calendarService', {calendarHomeId: '123'});
        $provide.value('miniCalendarService', {miniCalendarMobileId: '456'});
        $provide.constant('uiCalendarConfig', self.uiCalendarConfig);
      });
    });

    beforeEach(function() {
      angular.mock.inject(function(_$compile_, _$rootScope_) {
        this.$compile = _$compile_;
        this.$rootScope = _$rootScope_;
        this.$scope = this.$rootScope.$new();
      });

      this.initDirective = function(scope) {
        var element = this.$compile('<span calendar-date-indicator>{{dateIndicator}}</span>')(scope);
        scope.$digest();
        return element;
      };
    });

    it('should initialize the dateIndicator with the home calendar view title', function() {
      var element = this.initDirective(this.$scope);
      expect(this.uiCalendarConfig.calendars['123'].fullCalendar).to.have.been.calledWith('getView');
      expect(element.html()).to.equal('aDate');
    });

    it('should change the dateIndicator on home calendar change', function() {
      var element = this.initDirective(this.$scope);
      this.$rootScope.$broadcast('calendar:homeViewChange', {title: 'newDate'});
      this.$scope.$digest();
      expect(this.uiCalendarConfig.calendars['123'].fullCalendar).to.have.been.calledWith('getView');
      expect(element.html()).to.equal('newDate');
    });

    it('should change the dateIndicator on mini calendar change if it is shown', function() {
      var element = this.initDirective(this.$scope);

      this.$rootScope.$broadcast('calendar:mini:toggle');
      this.$scope.$digest();
      expect(element.html()).to.equal('aMiniDate');

      this.$rootScope.$broadcast('calendar:mini:viewchange', {title: 'newnewDate'});
      this.$scope.$digest();
      expect(element.html()).to.equal('newnewDate');
      expect(this.uiCalendarConfig.calendars['123'].fullCalendar).to.have.been.calledOnce;
      expect(this.uiCalendarConfig.calendars['456'].fullCalendar).to.have.been.calledOnce;
    });

    it('should change the dateIndicator on mini calendar toggle if it is shown', function() {
      this.$scope.miniCalendarIsShown = false;
      var element = this.initDirective(this.$scope);
      this.$rootScope.$broadcast('calendar:mini:toggle');
      this.$scope.$digest();

      expect(element.html()).to.equal('aMiniDate');
      expect(this.uiCalendarConfig.calendars['123'].fullCalendar).to.have.been.calledOnce;
      expect(this.uiCalendarConfig.calendars['456'].fullCalendar).to.have.been.calledOnce;
    });

    it('should change the dateIndicator on home calendar toggle if mini calendar is not shown', function() {
      this.$scope.miniCalendarIsShown = true;
      var element = this.initDirective(this.$scope);
      this.$rootScope.$broadcast('calendar:mini:toggle');
      this.$scope.$digest();
      expect(element.html()).to.equal('aMiniDate');

      this.$rootScope.$broadcast('calendar:mini:toggle');
      this.$scope.$digest();
      expect(element.html()).to.equal('aDate');
      expect(this.uiCalendarConfig.calendars['123'].fullCalendar).to.have.been.callCount(2);
    });
  });
});
