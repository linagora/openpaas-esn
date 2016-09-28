'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The calendarCurrentView factory', function() {
  var locationMock, screenSizeMock, fcMoment, calendarCurrentView, CALENDAR_AVAILABLE_VIEWS;

  beforeEach(function() {
    locationMock = {};
    screenSizeMock = {
      is: function() {
        return false;
      }
    };
    angular.mock.module('esn.calendar');

    angular.mock.module(function($provide) {
      $provide.value('$location', locationMock);
      $provide.value('screenSize', screenSizeMock);
    });

    angular.mock.inject(function(_fcMoment_, _calendarCurrentView_, _CALENDAR_AVAILABLE_VIEWS_) {
      fcMoment = _fcMoment_;
      calendarCurrentView = _calendarCurrentView_;
      CALENDAR_AVAILABLE_VIEWS = _CALENDAR_AVAILABLE_VIEWS_;
    });
  });

  describe('the set function', function() {

    it('should set start and name of current view in get parameter for day and weekView', function() {
      var date = '2015-12-01';

      ['agendaWeek', 'agendaDay'].forEach(function(name) {
        locationMock.search = sinon.spy(function(param) {
          expect(param).to.deep.equals({
            viewMode: name,
            start: date
          });
        });
        calendarCurrentView.set({
          start: fcMoment(date),
          name: name
        });

        expect(locationMock.search).to.have.been.calledOnce;
      });
    });

    it('should compute first day of month when saving a month view even if the day given is just before this month', function() {
      var firstDayOfMonthDate = '2015-12-01';

      locationMock.search = sinon.spy(function(param) {
        expect(param).to.deep.equals({
          viewMode: 'month',
          start: firstDayOfMonthDate
        });
      });

      calendarCurrentView.set({
        start: fcMoment('2015-11-30'),
        name: 'month'
      });

      expect(locationMock.search).to.have.been.calledOnce;
    });

    it('should save the value of the current view in the url and in RAM', function() {

      locationMock.search = sinon.spy();

      calendarCurrentView.set({
        name: 'month',
        start: fcMoment('2015-11-30')
      });

      var resGet = calendarCurrentView.get();

      expect(locationMock.search).to.have.been.calledWith({
        viewMode: 'month',
        start: '2015-12-01'
      });
      expect(resGet.name).to.equal('month');
      expect(resGet.start.isSame(fcMoment('2015-11-30'), 'day')).to.be.true;
    });
  });

  describe('the get function', function() {

    it('should return valid view name from get param', function() {
      CALENDAR_AVAILABLE_VIEWS.forEach(function(name) {
        locationMock.search = sinon.stub().returns({viewMode: name});

        var view = calendarCurrentView.get();

        expect(locationMock.search).to.have.been.calledOnce;
        expect(view.name).to.equals(name);
      });
    });

    it('should ignore invalid view name from get param', function() {
      locationMock.search = sinon.stub().returns({viewMode: 'the beatles'});

      var view = calendarCurrentView.get();

      expect(locationMock.search).to.have.been.calledOnce;
      expect(view.name).to.be.undefined;
    });

    it('should return valid date from get param', function() {
      var validDate = '1980-12-08';

      locationMock.search = sinon.stub().returns({start: validDate});

      var view = calendarCurrentView.get();

      expect(locationMock.search).to.have.been.calledOnce;
      expect(view.start.format('YYYY-MM-DD')).to.equals(validDate);
    });

    it('should ignore invalid date from get param in keep defaultDate of calendar config', function() {
      locationMock.search = sinon.stub().returns({start: '2001-11-29a'});

      var view = calendarCurrentView.get();

      expect(locationMock.search).to.have.been.calledOnce;
      expect(view.start).to.be.undefined;
    });

    it('should force 3days view on mobile if viewMode is not defined', function() {
      locationMock.search = sinon.stub().returns({});
      screenSizeMock.is = sinon.stub().returns(true);

      var view = calendarCurrentView.get();

      expect(locationMock.search).to.have.been.calledOnce;
      expect(screenSizeMock.is).to.have.been.calledWith('xs, sm');
      expect(view.name).to.equal('agendaThreeDays');
    });

    it('should get the value of location if no set before', function() {
      locationMock.search = sinon.stub().returns({viewMode: 'month', start: '2015-12-01'});

      var resGet = calendarCurrentView.get();

      expect(resGet.name).to.equal('month');
      expect(resGet.start.isSame(fcMoment('2015-12-01'))).to.be.true;
    });
  });
});
