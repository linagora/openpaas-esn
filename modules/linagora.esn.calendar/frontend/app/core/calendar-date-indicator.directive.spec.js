'use strict';

/* global chai: false */
/* global sinon: false */
var expect = chai.expect;

describe('The calendar module directives', function() {

  beforeEach(function() {
    module('jadeTemplates');
    angular.mock.module('linagora.esn.graceperiod', 'esn.calendar');
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
        var element = this.$compile('<span calendar-date-indicator>{{vm.dateIndicator}}</span>')(scope);

        scope.$digest();
        this.eleScope = element.isolateScope();

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
