'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The calendarVisibilityService', function() {
  var self;

  beforeEach(function() {
    self = this;
    this.storageData = {};

    this.storage = {
      iterate: function(callback) {
        angular.forEach(self.storageData, callback);

        return self.$q.when();
      },
      getItem: function(id) {
        return $q.when(self.storageData[id]);
      },
      setItem: function(id, hidden) {
        self.storageData[id] = hidden;

        return $q.when(hidden);
      }
    };

    this.localStorageServiceMock = {
      getOrCreateInstance: sinon.stub().returns(this.storage)
    };

    angular.mock.module('esn.calendar', function($provide) {
      $provide.value('localStorageService', self.localStorageServiceMock);
    });
  });

  beforeEach(angular.mock.inject(function(calendarVisibilityService, $rootScope, CAL_EVENTS, $q) {
    self.calendarVisibilityService = calendarVisibilityService;
    self.$rootScope = $rootScope;
    self.CAL_EVENTS = CAL_EVENTS;
    self.$q = $q;
  }));

  describe('getHiddenCalendars function', function() {
    it('should return calendars as it was saved in the localstorage', function() {
      var thenSpy = sinon.spy();
      this.storageData.hiddenCalendarUniqueId = true;
      this.storageData.visibleCalendarUniqueId = false;
      this.calendarVisibilityService.getHiddenCalendars().then(thenSpy);

      this.$rootScope.$digest();
      expect(thenSpy).to.have.been.calledWith(['hiddenCalendarUniqueId']);
      expect(this.localStorageServiceMock.getOrCreateInstance).to.have.been.calledWith('calendarStorage');
    });

    it('should not return unhidden calendar', function() {
      var hiddenCalendars = [{uniqueId: '1'}, {uniqueId: '2'}];
      hiddenCalendars.map(this.calendarVisibilityService.toggle);
      this.$rootScope.$digest();

      this.calendarVisibilityService.toggle(hiddenCalendars[0]);
      this.$rootScope.$digest();

      var thenSpy = sinon.spy();

      this.calendarVisibilityService.getHiddenCalendars().then(thenSpy);
      this.$rootScope.$digest();
      expect(thenSpy).to.have.been.calledWith(['2']);
    });
  });

  describe('the toggle function', function() {
    it('should broadcast the calendar and it new display status', function() {
      var cal = {uniqueId: 42};

      this.$rootScope.$broadcast = sinon.spy(this.$rootScope.$broadcast);

      this.calendarVisibilityService.toggle(cal);
      this.$rootScope.$digest();
      expect(this.$rootScope.$broadcast).to.have.been.calledWith(
        this.CAL_EVENTS.CALENDARS.TOGGLE_VIEW,
        {calendarUniqueId: cal.uniqueId, hidden: true}
      );

      this.$rootScope.$broadcast.reset();

      this.calendarVisibilityService.toggle(cal);
      this.$rootScope.$digest();
      expect(this.$rootScope.$broadcast).to.have.been.calledWith(
        this.CAL_EVENTS.CALENDARS.TOGGLE_VIEW,
        {calendarUniqueId: cal.uniqueId, hidden: false}
      );
    });

    it('should correctly record hidden calendar in localforage', function() {
      var hiddenCalendars = [{uniqueId: '1'}, {uniqueId: '2'}];

      hiddenCalendars.map(this.calendarVisibilityService.toggle);
      this.$rootScope.$digest();
      var thenSpy = sinon.spy();
      this.calendarVisibilityService.getHiddenCalendars().then(thenSpy);
      this.$rootScope.$digest();

      expect(thenSpy).to.have.been.calledWith(['1', '2']);
    });
  });

  describe('The isHidden function', function() {
    it('should return true if and only if the calendar is hidden', function() {
      var cal = {uniqueId: 42};
      var thenSpy = sinon.spy();

      this.calendarVisibilityService.isHidden(cal).then(thenSpy);
      this.$rootScope.$digest();
      expect(thenSpy).to.have.been.calledWith(false);

      thenSpy.reset();

      this.calendarVisibilityService.toggle(cal);
      this.$rootScope.$digest();

      this.calendarVisibilityService.isHidden(cal).then(thenSpy);
      this.$rootScope.$digest();
      expect(thenSpy).to.have.been.calledWith(true);
    });
  });
});
