'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('the CalendarPublicConsultation controller', function() {
  var $controller, $rootScope, $logMock, calendar1, calendar2, owner, CalendarPublicConsultationController, $stateParamsMock, lodashMock, calPublicCalendarStoreMock, CAL_CALENDAR_RIGHT;

  beforeEach(function() {
    $logMock = {
      error: sinon.spy(),
      info: sinon.spy(),
      debug: sinon.spy()
    };

    owner = {
      firstname: 'calendarOwner'
    };

    calendar1 = {
      id: '1',
      name: 'name1',
      color: 'color1',
      description: 'description1',
      rights: {
        getUserRight: sinon.spy(function() {
          return CAL_CALENDAR_RIGHT.READ;
        }),
        getPublicRight: sinon.spy(function() {
          return CAL_CALENDAR_RIGHT.PUBLIC_READ;
        })
      },
      getOwner: function() {
        return $q.when(owner);
      }
    };

    calendar2 = {
      id: '2',
      name: 'name2',
      color: 'color2',
      description: 'description2',
      rights: {
        getUserRight: sinon.spy(function() {
          return CAL_CALENDAR_RIGHT.READ;
        }),
        getPublicRight: sinon.spy(function() {
          return CAL_CALENDAR_RIGHT.PUBLIC_READ;
        })
      },
      getOwner: function() {
        return $q.when(owner);
      }
    };

    $stateParamsMock = { calendarId: '1' };

    lodashMock = {
      find: sinon.spy(function() {
        return calendar1;
      })
    };

    calPublicCalendarStoreMock = {
      getAll: sinon.spy(function() {
        return [calendar1, calendar2];
      })
    };

    angular.mock.module('esn.calendar');

    angular.mock.module(function($provide) {
      $provide.value('calPublicCalendarStore', calPublicCalendarStoreMock);
      $provide.value('$stateParams', $stateParamsMock);
      $provide.value('_', lodashMock);
      $provide.value('$log', $logMock);
    });

    angular.mock.inject(function(_$controller_, _$rootScope_, _CAL_CALENDAR_RIGHT_) {
      $controller = _$controller_;
      $rootScope = _$rootScope_;
      CAL_CALENDAR_RIGHT = _CAL_CALENDAR_RIGHT_;
    });
  });

  beforeEach(function() {
    CalendarPublicConsultationController = $controller('CalendarPublicConsultationController');
  });

  describe('$onInit function', function() {

    describe('when $stateParams.calendarId is undefined', function() {

      beforeEach(function() {
        delete $stateParamsMock.calendarId;

        CalendarPublicConsultationController.$onInit();
      });

      it('should not initialize publicCalendar', function() {
        expect(CalendarPublicConsultationController.publicCalendar).to.be.undefined;
      });

      it('should not initialize publicCalendarOwner', function() {
        expect(CalendarPublicConsultationController.publicCalendarOwner).to.be.undefined;
      });

      it('should not initialize PublicRight', function() {
        expect(CalendarPublicConsultationController.publicRight).to.be.undefined;
      });

      it('should display an error message', function() {
        expect($logMock.error).to.have.been.calledWith('the calendar id is not found');
      });
    });

    describe('when $stateParams.calendarId is defined', function() {

      beforeEach(function() {
        CalendarPublicConsultationController.$onInit();

        $rootScope.$digest();
      });

      it('should initialize publicCalendar with calendar returned from its id', function() {
        expect(CalendarPublicConsultationController.publicCalendar).to.deep.equal(calendar1);
      });

      it('should initialize publicCalendarOwner with the calendar owner', function() {
        expect(CalendarPublicConsultationController.publicCalendarOwner).to.deep.equal(owner);
      });

      it('should initialize PublicRight with the calendar public right', function() {
        expect(CalendarPublicConsultationController.publicRight).to.be.equal(CAL_CALENDAR_RIGHT.PUBLIC_READ);
      });
    });
  });
});
