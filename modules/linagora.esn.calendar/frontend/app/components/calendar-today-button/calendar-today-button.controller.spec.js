(function() {
  'use strict';

  /* global chai, sinon: false */

  var expect = chai.expect;

  describe('The CalendarTodayButtonController controller', function() {
    var $controller, clock;

    beforeEach(function() {
      var now = new Date();

      angular.mock.module('esn.calendar');
      angular.mock.inject(function(_$controller_) {
        $controller = _$controller_;
      });
      clock = sinon.useFakeTimers(now.getTime());
    });

    afterEach(function() {
      clock.restore();
    });

    function initController() {
      return $controller('CalendarTodayButtonController');
    }

    it('should set todayDate', function() {
      var date = new Date();
      var ctrl = initController();

      expect(ctrl.todayDate).to.equalDate(date);
    });
  });
})();
