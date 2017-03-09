(function() {
  'use strict';

  /* global chai: false */

  var expect = chai.expect;

  describe('The CalendarTodayButtonController', function() {
    var $controller;

    beforeEach(function() {
      angular.mock.module('esn.calendar');
      angular.mock.inject(function(_$controller_) {
        $controller = _$controller_;
      });
    });

    function initController() {
      return $controller('CalendarTodayButtonController');
    }

    it('should get todayDate when initialize calendar-today-button component', function() {
      var ctrl = initController();
      var date = new Date();

      expect(ctrl.todayDate).to.deep.equal(date);
    });
  });
})();
