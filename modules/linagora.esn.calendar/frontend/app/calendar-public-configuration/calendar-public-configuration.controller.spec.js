'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The CalCalendarPublicConfigurationController controller', function() {
  var $rootScope,
    $controller,
    $q,
    $log,
    calendarService,
    calendarHomeService,
    user,
    anotherUser,
    calendar,
    anotherCalendar,
    notificationFactory,
    calendarHomeId,
    CalendarCollectionShell,
    userAndExternalCalendars,
    publicCalendars;

  beforeEach(function() {
    CalendarCollectionShell = {};
    publicCalendars = [];
    userAndExternalCalendars = sinon.spy(function() {
      return {
        publicCalendars: publicCalendars
      };
    });
  });

  beforeEach(function() {
    angular.mock.module('esn.calendar', function($provide) {
      $provide.value('CalendarCollectionShell', CalendarCollectionShell);
      $provide.value('userAndExternalCalendars', userAndExternalCalendars);
    });
  });

  beforeEach(function() {
    calendarHomeId = 'calendarHomeId';
    user = {_id: 1};
    anotherUser = {_id: 2};
    calendar = {_id: 3};
    anotherCalendar = {_id: 4};
    angular.mock.inject(function(_$rootScope_, _$controller_, _$q_, _$log_, _calendarService_, _calendarHomeService_, _notificationFactory_) {
      $rootScope = _$rootScope_;
      $controller = _$controller_;
      $q = _$q_;
      $log = _$log_;
      calendarService = _calendarService_;
      notificationFactory = _notificationFactory_;
      calendarHomeService = _calendarHomeService_;
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
    beforeEach(function() {
      sinon.stub(calendarHomeService, 'getUserCalendarHomeId', function() {
        return $q.when(calendarHomeId);
      });
    });

    it('should return when user is undefined', function() {
      var spy = sinon.stub(calendarService, 'listPublicCalendars');
      var controller = initController();

      controller.onUserAdded();

      expect(spy).to.not.have.been.called;
    });

    it('should fill controller calendarsPerUser with the user calendars', function() {
      var listPublicCalendarsStub = sinon.stub(calendarService, 'listPublicCalendars', function() {
        return $q.when([calendar]);
      });
      var listCalendarsStub = sinon.stub(calendarService, 'listCalendars', function() {
        return $q.when([]);
      });
      var controller = initController();

      controller.onUserAdded(user);
      $rootScope.$digest();

      expect(listPublicCalendarsStub).to.have.been.calledWith(user._id);
      expect(listCalendarsStub).to.have.been.calledWith(calendarHomeId);
      expect(controller.calendarsPerUser).to.deep.equal([{user: user, calendar: calendar}]);
    });

    it('should not fill calendarsPerUser with a calendar which has already been subscribed', function() {
      var subscribedHref = 'This is the href of the original calendar';
      var subscribed = {source: subscribedHref};

      calendar.href = subscribedHref;
      publicCalendars.push(subscribed);

      var listPublicCalendarsStub = sinon.stub(calendarService, 'listPublicCalendars', function() {
        return $q.when([calendar]);
      });
      var listCalendarsStub = sinon.stub(calendarService, 'listCalendars', function() {
        return $q.when([subscribed]);
      });

      var controller = initController();

      controller.calendarsPerUser.push({calendar: calendar, user: user});
      controller.calendarsPerUser.push({calendar: anotherCalendar, user: anotherUser});
      controller.onUserAdded(user);
      $rootScope.$digest();

      expect(listPublicCalendarsStub).to.have.been.calledWith(user._id);
      expect(listCalendarsStub).to.have.been.calledWith(calendarHomeId);
      expect(userAndExternalCalendars).to.have.been.calledWith([subscribed]);
      expect(controller.calendarsPerUser).to.have.lengthOf(2);
    });

    it('should log error when public calendars fetch fails', function() {
      var listPublicCalendarsStub = sinon.stub(calendarService, 'listPublicCalendars', function() {
        return $q.reject(new Error('I failed'));
      });
      var logSpy = sinon.spy($log, 'error');
      var controller = initController();

      controller.onUserAdded(user);
      $rootScope.$digest();

      expect(listPublicCalendarsStub).to.have.been.calledWith(user._id);
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
    var weakInfoSpy, weakErrorSpy;

    beforeEach(function() {
      sinon.stub(calendarHomeService, 'getUserCalendarHomeId', function() {
        return $q.when(calendarHomeId);
      });

      weakInfoSpy = sinon.spy(notificationFactory, 'weakInfo');
      weakErrorSpy = sinon.spy(notificationFactory, 'weakError');
    });

    it('should not call subscribe service when no calendar has been selected', function() {
      var controller = initController();
      var subscribeSpy = sinon.spy(calendarService, 'subscribe');

      controller.calendarsPerUser.push({calendar: calendar, user: user});
      controller.calendarsPerUser.push({calendar: anotherCalendar, user: anotherUser});

      controller.subscribeToSelectedCalendars();
      $rootScope.$digest();

      expect(subscribeSpy).to.not.have.been.called;
      expect(weakInfoSpy).to.not.have.been.called;
      expect(weakErrorSpy).to.not.have.been.called;
    });

    it('should subscribe to all the selected calendars', function() {
      var controller = initController();
      var subscribeStub = sinon.stub(calendarService, 'subscribe', function() {
        return $q.when();
      });
      var shell = {foo: 'bar'};

      CalendarCollectionShell.from = sinon.spy(function() {
        return shell;
      });
      CalendarCollectionShell.buildHref = sinon.spy(function(home, id) {
        return home + id;
      });

      controller.calendarsPerUser.push({calendar: calendar, user: user, isSelected: true});
      controller.calendarsPerUser.push({calendar: anotherCalendar, user: anotherUser, isSelected: true});
      controller.calendarsPerUser.push({calendar: anotherCalendar, user: anotherUser, isSelected: false});

      controller.subscribeToSelectedCalendars();
      $rootScope.$digest();

      expect(CalendarCollectionShell.from).to.have.been.calledTwice;
      expect(subscribeStub).to.have.been.calledTwice;
      expect(weakInfoSpy).to.have.been.calledOnce;
      expect(weakErrorSpy).to.not.have.been.called;
    });

    it('should reject when one subscription fails', function() {
      var controller = initController();
      var error = new Error('I failed to subscribe');
      var subscribeStub = sinon.stub(calendarService, 'subscribe', function() {
        return $q.reject(error);
      });
      var shell = {foo: 'bar'};

      CalendarCollectionShell.from = sinon.spy(function() {
        return shell;
      });
      CalendarCollectionShell.buildHref = sinon.spy(function(home, id) {
        return home + id;
      });

      controller.calendarsPerUser.push({calendar: calendar, user: user, isSelected: true});
      controller.calendarsPerUser.push({calendar: anotherCalendar, user: anotherUser, isSelected: true});

      controller.subscribeToSelectedCalendars();
      $rootScope.$digest();

      expect(CalendarCollectionShell.from).to.have.been.calledTwice;
      expect(subscribeStub).to.have.been.calledTwice;
      expect(weakInfoSpy).to.not.have.been.called;
      expect(weakErrorSpy).to.have.been.called;
    });
  });
});
