'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The calEventAlarmEditionController', function() {
  var $controller, asSession, calEventsProviders, TRIGGER;

  beforeEach(function() {

    asSession = {
      user: {
        _id: '123456',
        emails: ['test@open-paas.org'],
        emailMap: {'test@open-paas.org': true}
      },
      domain: {
        company_name: 'test',
        _id: 'domainId'
      },
      ready: {
        then: angular.noop
      }
    };

    calEventsProviders = function() {
      return {
        setUpSearchProviders: angular.noop
      };
    };

    angular.mock.module('esn.calendar', function($provide) {
      $provide.value('session', asSession);
      $provide.factory('calEventsProviders', calEventsProviders);
    });

    angular.mock.inject(function(_$controller_, _TRIGGER_, _calEventsProviders_) {
      $controller = _$controller_;
      TRIGGER = _TRIGGER_;
      calEventsProviders = _calEventsProviders_;
    });
  });

  function initController() {
    return $controller('calEventAlarmEditionController', null, { event: {} });
  }

  it('should scope.setEventAlarm set the event alarm', function() {
    var ctrl = initController();

    ctrl.trigger = TRIGGER[1].value;
    ctrl.setEventAlarm();

    expect(ctrl.event).to.deep.equal({
      alarm: {
        trigger: TRIGGER[1].value,
        attendee: 'test@open-paas.org'
      }
    });
  });
});
