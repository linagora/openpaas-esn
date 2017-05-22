'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The CalCalendarPublicConfigurationController controller', function() {
  var $rootScope,
    $controller,
    $q,
    $log,
    calendarService,
    calPublicCalendarStore,
    user,
    anotherUser,
    calendar,
    anotherCalendar;

  beforeEach(function() {
    angular.mock.module('esn.calendar');

    user = {_id: 1};
    anotherUser = {_id: 2};
    calendar = {_id: 3};
    anotherCalendar = {_id: 4};
    angular.mock.inject(function(_$rootScope_, _$controller_, _$q_, _$log_, _calendarService_, _calPublicCalendarStore_) {
      $rootScope = _$rootScope_;
      $controller = _$controller_;
      $q = _$q_;
      $log = _$log_;
      calendarService = _calendarService_;
      calPublicCalendarStore = _calPublicCalendarStore_;
    });
  });

  function initController() {
    return $controller('CalCalendarPublicConfigurationController');
  }

  describe('The getSelectedCalendars function', function() {
    it('should return empty array when no calendar are selected', function() {
      var controller = initController();

      controller.calendarsPerUser.push({user: user, calendar: calendar});

      expect(controller.getSelectedCalendars()).to.be.empty;
    });

    it('should return only calendars which have been selected', function() {
      var controller = initController();

      controller.calendarsPerUser.push({user: user, calendar: calendar, isSelected: true});

      expect(controller.getSelectedCalendars()).to.deep.equal([calendar]);
    });
  });

  describe('The onUserAdded function', function() {
    it('should return when user is undefined', function() {
      var spy = sinon.stub(calendarService, 'listAllCalendarsForUser');
      var controller = initController();

      controller.onUserAdded();

      expect(spy).to.not.have.been.called;
    });

    it('should fill controller calendarsPerUser with the user calendars', function() {
      var listAllCalendarsForUserStub = sinon.stub(calendarService, 'listAllCalendarsForUser', function() {
        return $q.when([calendar]);
      });
      var controller = initController();

      controller.onUserAdded(user);
      $rootScope.$digest();

      expect(listAllCalendarsForUserStub).to.have.been.calledWith(user._id);
      expect(controller.calendarsPerUser).to.deep.equal([{user: user, calendar: calendar}]);
    });

    it('should log error when public calendars fetch fails', function() {
      var listAllCalendarsForUserStub = sinon.stub(calendarService, 'listAllCalendarsForUser', function() {
        return $q.reject(new Error('I failed'));
      });
      var logSpy = sinon.spy($log, 'error');
      var controller = initController();

      controller.onUserAdded(user);
      $rootScope.$digest();

      expect(listAllCalendarsForUserStub).to.have.been.calledWith(user._id);
      expect(logSpy).to.have.been.calledOnce;
      expect(controller.calendarsPerUser).to.be.empty;
    });
  });

  describe('The onUserRemoved function', function() {
    it('should not change the controller calendars when user is not defined', function() {
      var controller = initController();

      controller.calendarsPerUser.push({calendar: calendar, user: user});
      controller.onUserRemoved();
      $rootScope.$digest();

      expect(controller.calendarsPerUser).to.have.lengthOf(1);
    });

    it('should remove all the calendars of the given user', function() {
      var controller = initController();

      controller.calendarsPerUser.push({calendar: calendar, user: user});
      controller.calendarsPerUser.push({calendar: anotherCalendar, user: anotherUser});

      controller.onUserRemoved(user);
      $rootScope.$digest();

      expect(controller.calendarsPerUser).to.deep.equal([{calendar: anotherCalendar, user: anotherUser}]);
    });
  });

  describe('The subscribeToSelectedCalendars function', function() {
    it('should not store calendars when no calendars are selected', function() {
      var controller = initController();
      var storeSpy = sinon.spy(calPublicCalendarStore, 'storeAll');

      controller.calendarsPerUser.push({calendar: calendar, user: user});
      controller.calendarsPerUser.push({calendar: anotherCalendar, user: anotherUser});

      controller.subscribeToSelectedCalendars();
      $rootScope.$digest();

      expect(storeSpy).to.not.have.been.called;
    });

    it('should store selected calendars', function() {
      var controller = initController();
      var storeSpy = sinon.spy(calPublicCalendarStore, 'storeAll');

      controller.calendarsPerUser.push({calendar: calendar, user: user, isSelected: true});
      controller.calendarsPerUser.push({calendar: anotherCalendar, user: anotherUser});

      controller.subscribeToSelectedCalendars();
      $rootScope.$digest();

      expect(storeSpy).to.have.been.calledWith([calendar]);
    });
  });
});
