'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The calendarSubHeaderController', function() {
  var calendarCurrentViewMock, $scope, calMoment;

  beforeEach(function() {
    calendarCurrentViewMock = {isCurrentViewAroundDay: sinon.spy()};

    angular.mock.module('esn.calendar', function($provide) {
      $provide.value('calendarCurrentView', calendarCurrentViewMock);
    });
  });

  beforeEach(angular.mock.inject(function($rootScope, $controller, _calMoment_) {
    $scope = $rootScope.$new();
    $controller('calendarSubHeaderController', {$scope: $scope});
    calMoment = _calMoment_;
  }));

  describe('the isCurrentViewAroundToday function', function() {

    it('should call calendarCurrentView.isCurrentViewAroundDay with today', function() {
      $scope.isCurrentViewAroundToday();
      expect(calendarCurrentViewMock.isCurrentViewAroundDay).to.have.been.calledWith(sinon.match(function(date) {
        return date.isSame(calMoment(), 'day');
      }));
    });

    it('should return true if the current day is displayed', function() {
      calendarCurrentViewMock.isCurrentViewAroundDay = sinon.stub().returns(true);
      expect($scope.isCurrentViewAroundToday()).to.be.true;
    });

    it('should return fales if the current day is not displayed', function() {
      calendarCurrentViewMock.isCurrentViewAroundDay = sinon.stub().returns(false);
      expect($scope.isCurrentViewAroundToday()).to.be.false;
    });
  });
});
