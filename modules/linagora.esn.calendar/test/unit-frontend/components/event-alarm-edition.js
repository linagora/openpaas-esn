'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The event-alarm-edition component', function() {
  var asSession, TRIGGER;

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
      }
    };

    module('jadeTemplates');
    angular.mock.module('esn.calendar');
    angular.mock.module(function($provide) {
      $provide.value('session', asSession);
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
    this.eleScope.trigger = this.TRIGGER[0].value;
    this.eleScope.setEventAlarm();
    expect(this.eleScope.event).to.deep.equal({
      alarm: {
        trigger: this.TRIGGER[0].value,
        attendee: 'test@open-paas.org'
      }
    });
  });
});
