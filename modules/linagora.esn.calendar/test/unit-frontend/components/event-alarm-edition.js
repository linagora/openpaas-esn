'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The event-alarm-edition component', function() {
  var asSession;

  beforeEach(function() {

    asSession = {
      user: {
        _id: '123456',
        emails: ['test@open-paas.org'],
        emailMap: { 'test@open-paas.org': true }
      },
      domain: {
        company_name: 'test',
        _id: 'domainId'
      },
      ready: {
        then: function() {}
      }
    };

    module('jadeTemplates');
    angular.mock.module('esn.calendar');
    angular.mock.module(function($provide) {
      $provide.value('session', asSession);
      $provide.factory('eventsProviders', function() {
        return {
          setUpSearchProviders: function() {}
        };
      });
    });
  });

  beforeEach(inject(['$compile', '$rootScope', function($c, $r) {
    this.$compile = $c;
    this.$scope = $r.$new();

    this.$scope.event = {};

    this.initDirective = function(scope) {
      var html = '<event-alarm-edition event="event"/>';
      var element = this.$compile(html)(scope);

      scope.$digest();
      this.eleScope = element.isolateScope();

      return element;
    };
  }]));

  beforeEach(function() {
    angular.mock.inject(function(TRIGGER) {
      this.TRIGGER = TRIGGER;
    });
  });

  it('should scope.setEventAlarm set the event alarm', function() {
    this.initDirective(this.$scope);
    this.eleScope.vm.trigger = this.TRIGGER[1].value;
    this.eleScope.vm.setEventAlarm();
    expect(this.eleScope.vm.event).to.deep.equal({
      alarm: {
        trigger: this.TRIGGER[1].value,
        attendee: 'test@open-paas.org'
      }
    });
  });
});
