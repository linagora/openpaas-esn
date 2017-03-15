'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The calendarsList controller', function() {
  var $rootScope, $scope, $controller, CalendarCollectionShell, CALENDAR_EVENTS, CALENDAR_RIGHT, CALENDAR_SHARED_RIGHT;
  var calendars, CalendarsListController, calendarServiceMock, hiddenCalendar, calendarVisibilityServiceMock, calPublicCalendarStoreMock, publicCalendar;

  function initController() {
    return $controller('CalendarsListController', { $scope: $scope });
  }

  beforeEach(function() {
    calendarServiceMock = {
      listCalendars: sinon.spy(function() {
        return $q.when(calendars);
      })
    };

    hiddenCalendar = {id: 123};

    calendarVisibilityServiceMock = {
      getHiddenCalendars: sinon.spy(function() {
        return $q.when([hiddenCalendar.id]);
      }),
      isHidden: sinon.spy(),
      toggle: sinon.spy()
    };

    publicCalendar = {
      id: '5',
      href: 'public calendar href',
      name: 'public calendar name',
      color: 'public calendar color',
      description: 'public calendar description'
    };

    calPublicCalendarStoreMock = {
      getAll: function() {
        return [];
      }
    };

    angular.mock.module('esn.calendar');

    angular.mock.module(function($provide) {
      $provide.value('calendarService', calendarServiceMock);
      $provide.value('calendarVisibilityService', calendarVisibilityServiceMock);
      $provide.value('calPublicCalendarStore', calPublicCalendarStoreMock);
    });

  });

  beforeEach(function() {
    angular.mock.inject(function(_$rootScope_, _$controller_, _CalendarCollectionShell_, _CALENDAR_EVENTS_, _CALENDAR_RIGHT_, _CALENDAR_SHARED_RIGHT_) {
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      $controller = _$controller_;
      CalendarCollectionShell = _CalendarCollectionShell_;
      CALENDAR_EVENTS = _CALENDAR_EVENTS_;
      CALENDAR_RIGHT = _CALENDAR_RIGHT_;
      CALENDAR_SHARED_RIGHT = _CALENDAR_SHARED_RIGHT_;
    });
  });

  beforeEach(function() {
    calendars = [CalendarCollectionShell.from({
      href: '/calendars/12345/1.json',
      name: 'name',
      color: 'color',
      description: 'description'
    }), CalendarCollectionShell.from({
      href: '/calendars/12345/2.json',
      name: 'name2',
      color: 'color2',
      description: 'description2'
    })];

    CalendarsListController = initController();
  });

  describe('the $onInit function', function() {

    it('should initialize the calendars with empty array', function() {
      CalendarsListController.$onInit();

      expect(CalendarsListController.calendars).to.deep.equal([]);
    });

    it('should initialize the hiddenCalendars with empty object', function() {
      CalendarsListController.$onInit();

      expect(CalendarsListController.hiddenCalendars).to.deep.equal({});
    });

    it('should initialize the toggleCalendar with the calendarVisibilityService.toggle', function() {
      CalendarsListController.$onInit();

      expect(CalendarsListController.toggleCalendar).to.deep.equal(calendarVisibilityServiceMock.toggle);
    });

    it('should call the activate function', function() {
      CalendarsListController.activate = sinon.spy();

      CalendarsListController.$onInit();

      expect(CalendarsListController.activate).to.be.called;
    });
  });

  describe('the activate function', function() {

    describe('CALENDAR_EVENTS.CALENDARS.ADD listener', function() {

      it('call add calendar to self.calendars', function() {
        var newCalendar = CalendarCollectionShell.from({
          href: '/calendars/12345/3.json',
          name: 'name3',
          color: 'color3',
          description: 'description3'
        });
        var expectedResult = calendars.concat(newCalendar);

        CalendarsListController.$onInit();
        $rootScope.$apply();

        $rootScope.$broadcast(CALENDAR_EVENTS.CALENDARS.ADD, newCalendar);

        expect(CalendarsListController.calendars).to.deep.equal(expectedResult);
      });

      describe('refreshCalendarList on add', function() {
        beforeEach(function() {
          calendars = [{
            href: '/calendars/12345/1.json',
            name: 'name',
            color: 'color',
            description: 'description'
          }, {
            href: '/calendars/12345/2.json',
            name: 'name2',
            color: 'color2',
            description: 'description2',
            rights: {
              getUserRight: function() {
                return CALENDAR_RIGHT.SHAREE_READ;
              },
              getPublicRight: function() {
                return CALENDAR_RIGHT.PUBLIC_READ;
              }
            },
            isShared: function() {
              return CALENDAR_SHARED_RIGHT.SHAREE_READ;
            }
          }];
        });

        it('refresh calendars list', function() {
          var newCalendar = CalendarCollectionShell.from({
            href: '/calendars/12345/3.json',
            name: 'name3',
            color: 'color3',
            description: 'description3'
          });
          var expectedResult = calendars.concat(newCalendar);

          CalendarsListController.$onInit();
          $rootScope.$apply();

          $rootScope.$broadcast(CALENDAR_EVENTS.CALENDARS.ADD, newCalendar);

          expect(CalendarsListController.userCalendars).to.deep.equal([expectedResult[0], expectedResult[2]]);
          expect(CalendarsListController.sharedCalendars).to.deep.equal([expectedResult[1]]);
        });

        it('refresh calendars list and not consider the new calendar as shared once it is classified as personal', function() {
          var newCalendar = CalendarCollectionShell.from({
            href: '/calendars/12345/3.json',
            name: 'name3',
            color: 'color3',
            description: 'description3'
          });
          var expectedResult = calendars.concat(newCalendar);

          CalendarsListController.$onInit();
          $rootScope.$apply();

          $rootScope.$broadcast(CALENDAR_EVENTS.CALENDARS.ADD, newCalendar);

          expect(CalendarsListController.userCalendars).to.deep.equal([expectedResult[0], expectedResult[2]]);
          expect(CalendarsListController.sharedCalendars).to.deep.equal([expectedResult[1]]);
        });
      });
    });

    describe('CALENDAR_EVENTS.CALENDARS.REMOVE listener', function() {

      it('remove calendar to self.calendars', function() {
        var expectedResult = calendars.slice(1);

        CalendarsListController.$onInit();
        $rootScope.$apply();

        $rootScope.$broadcast(CALENDAR_EVENTS.CALENDARS.REMOVE, calendars[0]);

        expect(CalendarsListController.calendars).to.deep.equal(expectedResult);
      });

      it('refresh calendars list', function() {
        calendars = [{
          id: '1',
          href: 'href',
          name: 'name',
          color: 'color',
          description: 'description'
        }, {
          id: '2',
          href: 'href2',
          name: 'name2',
          color: 'color2',
          description: 'description2',
          rights: {
            getUserRight: function() {
              return CALENDAR_RIGHT.SHAREE_READ;
            },
            getPublicRight: function() {
              return CALENDAR_RIGHT.PUBLIC_READ;
            }
          },
          isShared: function() {
            return CALENDAR_SHARED_RIGHT.SHAREE_READ;
          }
        }];

        var expectedResult = calendars.slice(1);

        CalendarsListController.$onInit();
        $rootScope.$apply();

        $rootScope.$broadcast(CALENDAR_EVENTS.CALENDARS.REMOVE, calendars[0]);

        expect(CalendarsListController.calendars).to.deep.equal(expectedResult);
        expect(CalendarsListController.sharedCalendars).to.deep.equal(expectedResult);
        expect(CalendarsListController.userCalendars).to.deep.equal([]);
      });
    });

    describe('CALENDAR_EVENTS.CALENDARS.UPDATE listener', function() {

      it('should update calendar in self.calendars if existed', function() {
        var updatedCalendar = CalendarCollectionShell.from({
          href: '/calendars/12345/1.json',
          name: 'nameUpdated',
          color: 'colorUpdated',
          description: 'descriptionUpdated'
        });
        var expectedResult = [updatedCalendar].concat(calendars.slice(1));

        CalendarsListController.$onInit();
        $rootScope.$apply();

        $rootScope.$broadcast(CALENDAR_EVENTS.CALENDARS.UPDATE, updatedCalendar);

        expect(CalendarsListController.calendars).to.deep.equal(expectedResult);
      });

      it('should do nothing if the updated calendar does not exist in self.calendars', function() {
        var updatedCalendar = CalendarCollectionShell.from({
          href: '/calendars/12345/4.json',
          name: 'nameUpdated',
          color: 'colorUpdated',
          description: 'descriptionUpdated'
        });
        var expectedResult = calendars.slice(0);

        CalendarsListController.$onInit();
        $rootScope.$apply();

        $rootScope.$broadcast(CALENDAR_EVENTS.CALENDARS.UPDATE, updatedCalendar);

        expect(CalendarsListController.calendars).to.deep.equal(expectedResult);
      });
    });

    describe('CALENDAR_EVENTS.CALENDARS.TOGGLE_VIEW listener', function() {

      it('should set the visibility of the calendar', function() {
        CalendarsListController.$onInit();
        $rootScope.$apply();

        CalendarsListController.arrangeCalendars = sinon.spy();

        $rootScope.$broadcast(CALENDAR_EVENTS.CALENDARS.TOGGLE_VIEW, {
          calendarId: calendars[0].id,
          hidden: true
        });

        expect(CalendarsListController.hiddenCalendars[calendars[0].id]).to.be.true;

        $rootScope.$broadcast(CALENDAR_EVENTS.CALENDARS.TOGGLE_VIEW, {
          calendarId: calendars[0].id,
          hidden: false
        });

        expect(CalendarsListController.hiddenCalendars[calendars[0].id]).to.be.false;
      });
    });

    describe('the listCalendars function', function() {

      it('should initialize calendars with all the calendars from calendarService.listCalendars', function() {
        calPublicCalendarStoreMock.getAll = function() {
          return [publicCalendar];
        };

        CalendarsListController.$onInit();

        CalendarsListController.arrangeCalendars = sinon.spy();

        $rootScope.$digest();

        expect(CalendarsListController.calendars).to.deep.equal(calendars.concat(calPublicCalendarStoreMock.getAll()));
      });

      it('should call calendarService.listCalendars with the two params', function() {
        CalendarsListController.$onInit();

        expect(calendarServiceMock.listCalendars).to.be.called;
      });
    });

    describe('the getHiddenCalendars function', function() {

      it('should call calendarVisibilityService.getHiddenCalendars', function() {
        CalendarsListController.activate();

        expect(calendarVisibilityServiceMock.getHiddenCalendars).to.have.been.called;
      });

      it('should update hiddenCalendars and add all the hidden calendars returned by calendarVisibilityService.getHiddenCalendars', function() {
        CalendarsListController.$onInit();

        $rootScope.$digest();

        expect(CalendarsListController.hiddenCalendars[hiddenCalendar.id]).to.be.true;
      });
    });
  });

  describe('the toggleCalendar function', function() {

    it('should call calendarVisibilityService.toggle when we call the toggleCalendar function', function() {
      CalendarsListController.$onInit();

      CalendarsListController.toggleCalendar(calendars[0]);

      expect(calendarVisibilityServiceMock.toggle).to.have.been.calledWith(calendars[0]);
    });
  });
});
