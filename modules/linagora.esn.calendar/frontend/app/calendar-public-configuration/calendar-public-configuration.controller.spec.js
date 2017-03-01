'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The calendar public configuration controller', function() {
  var $controller;

  beforeEach(function() {
    angular.mock.module('esn.calendar');
    angular.mock.inject(function(_$controller_) {
      $controller = _$controller_;
    });
  });

  function initController() {
    return $controller('calendarPublicConfigurationController');
  }

  describe('the updateButtonDisplay function', function() {
    it('should set disableButton at true is users array is empty', function() {
      var ctrl = initController();

      ctrl.updateButtonDisplay();

      expect(ctrl.disableButton).to.be.true;
    });

    it('should set disableButton at false is users array is not empty', function() {
      var ctrl = initController();

      ctrl.users.push({});

      ctrl.updateButtonDisplay();

      expect(ctrl.disableButton).to.be.false;
    });
  });

});
