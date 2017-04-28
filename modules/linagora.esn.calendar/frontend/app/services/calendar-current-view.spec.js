'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The calendarCurrentView factory', function() {
  var locationMock, matchmediaMock, calMoment, calendarCurrentView, CAL_AVAILABLE_VIEWS, SM_XS_MEDIA_QUERY;

  beforeEach(function() {
    locationMock = {search: sinon.spy(), url: function() { return ''; }};
    matchmediaMock = {
      is: function() {
        return false;
      }
    };
    angular.mock.module('esn.calendar');

    angular.mock.module(function($provide) {
      $provide.value('$location', locationMock);
      $provide.value('matchmedia', matchmediaMock);
    });

    angular.mock.inject(function(_calMoment_, _calendarCurrentView_, _CAL_AVAILABLE_VIEWS_, _SM_XS_MEDIA_QUERY_) {
      calMoment = _calMoment_;
      calendarCurrentView = _calendarCurrentView_;
      CAL_AVAILABLE_VIEWS = _CAL_AVAILABLE_VIEWS_;
      SM_XS_MEDIA_QUERY = _SM_XS_MEDIA_QUERY_;
    });
  });

  describe('isCurrentViewAroundDay', function() {
    var periodStart, periodEnd, aDay, intervalStart, intervalEnd;

    //becarefull the end property of the view object returned by fullCalendar
    //is exclusive https://fullcalendar.io/docs/views/View_Object/

    beforeEach(function() {
      periodStart = calMoment([2016, 0, 10]);
      intervalStart = calMoment([2016, 0, 12]);
      intervalEnd = calMoment([2016, 0, 17]);
      periodEnd = calMoment([2016, 0, 20]);
      calendarCurrentView.set({
        start: periodStart,
        intervalStart: intervalStart,
        intervalEnd: intervalEnd,
        end: periodEnd
      });
    });

    it('should return false if the day given as a argument is before the current view', function() {
      aDay = intervalStart.clone().subtract(42, 'day');
      expect(calendarCurrentView.isCurrentViewAroundDay(aDay)).to.be.false;
    });

    it('should return false if the day given as a argument is after the current view', function() {
      aDay = intervalEnd.clone().add(1, 'day');
      expect(calendarCurrentView.isCurrentViewAroundDay(aDay)).to.be.false;
    });

    it('should return true if the day given as a argument is the first day in the current view', function() {
      aDay = intervalStart.clone();
      expect(calendarCurrentView.isCurrentViewAroundDay(aDay)).to.be.true;
    });

    it('should return true if the day given as a argument is last day in the current view', function() {
      aDay = intervalEnd.clone().subtract(1, 'day');
      expect(calendarCurrentView.isCurrentViewAroundDay(aDay)).to.be.true;
    });
  });

  describe('the set function', function() {

    it('should set intervalStart and name of current view in get parameter', function() {
      var intervalStart = '2015-12-01';
      var intervalEnd = '2015-12-31';
      var name = 'aViewMode';

      locationMock.search = sinon.spy();

      calendarCurrentView.set({
        start: calMoment(calMoment(intervalStart).subtract(2, 'day')),
        intervalStart: calMoment(intervalStart),
        intervalEnd: calMoment(intervalEnd),
        end: calMoment(intervalEnd).add(1, 'day'),
        name: name
      });

      expect(locationMock.search).to.have.been.calledWith({
        viewMode: name,
        start: intervalStart,
        end: intervalEnd
      });
    });

    it('should make get return the intervalEnd of the view if set register a view that has a end parameter', function() {
      var intervalEnd = calMoment([2016, 9, 9]);

      calendarCurrentView.set({
        intervalStart: calMoment([2016, 9, 8]),
        end: intervalEnd.clone().add(3, 'day'),
        intervalEnd: intervalEnd
      });

      expect(calendarCurrentView.get().end).to.equal(intervalEnd);
    });

    it('should save the value of the current view in the url and in RAM', function() {

      locationMock.search = sinon.spy();

      calendarCurrentView.set({
        name: 'month',
        intervalStart: calMoment('2015-11-30'),
        intervalEnd: calMoment('2015-12-30'),
        start: calMoment('2015-11-29')
      });

      var resGet = calendarCurrentView.get();

      expect(locationMock.search).to.have.been.calledWith({
        viewMode: 'month',
        start: '2015-11-30',
        end: '2015-12-30'
      });
      expect(resGet.name).to.equal('month');
      expect(resGet.start.isSame(calMoment('2015-11-30'), 'day')).to.be.true;
    });
  });

  describe('the get function', function() {

    it('should return valid view name from get param', function() {
      CAL_AVAILABLE_VIEWS.forEach(function(name) {
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

    it('should get the correct format of the set view', function() {
      var view = {
          intervalStart: calMoment('1980-12-08'),
          intervalEnd: calMoment('1980-12-09'),
          name: 'name',
          title: 'title'
      },
        expectedView = {
          start: view.intervalStart,
          end: view.intervalEnd,
          name: view.name,
          title: view.title
        };

      calendarCurrentView.set(view);

      expect(calendarCurrentView.get()).to.deep.equal(expectedView);
    });

    describe('comportement with invalid date', function() {
      /* global moment: false */
      beforeEach(function() {
        moment.suppressDeprecationWarnings = true;
      });

      it('should ignore invalid date from get param in keep defaultDate of calendar config', function() {
        locationMock.search = sinon.stub().returns({start: 'this is not a date'});

        var view = calendarCurrentView.get();

        expect(locationMock.search).to.have.been.calledOnce;
        expect(view.start).to.be.undefined;
      });

      afterEach(function() {
        moment.suppressDeprecationWarnings = false;
      });
    });

    it('should force 3days view on mobile if viewMode is not defined', function() {
      locationMock.search = sinon.stub().returns({});
      matchmediaMock.is = sinon.stub().returns(true);

      var view = calendarCurrentView.get();

      expect(locationMock.search).to.have.been.calledOnce;
      expect(matchmediaMock.is).to.have.been.calledWith(SM_XS_MEDIA_QUERY);
      expect(view.name).to.equal('agendaThreeDays');
    });

    it('should get the value of location if no set before', function() {
      locationMock.search = sinon.stub().returns({viewMode: 'month', start: '2015-12-01'});

      var resGet = calendarCurrentView.get();

      expect(resGet.name).to.equal('month');
      expect(resGet.start.isSame(calMoment('2015-12-01'))).to.be.true;
    });
  });
});
