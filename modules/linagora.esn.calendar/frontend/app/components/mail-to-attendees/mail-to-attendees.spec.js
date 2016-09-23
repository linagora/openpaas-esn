'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The mail-to-attendees component', function() {

  beforeEach(function() {
    module('jadeTemplates');
    angular.mock.module('esn.calendar');
  });

  beforeEach(inject(['$compile', '$rootScope', function($c, $r) {
    this.$compile = $c;
    this.$scope = $r.$new();

    this.$scope.event = {};

    this.initDirective = function(scope) {
      var html = '<mail-to-attendees event="event"/>';
      var element = this.$compile(html)(scope);

      scope.$digest();
      this.eleScope = element.isolateScope();

      return element;
    };
  }]));

  it('should initialize mail-to-attendees', function() {
    this.$scope.event.attendees = [
      { email: 'other1@example.com', partstat: 'NEEDS-ACTION', clicked: false },
      { email: 'other2@example.com', partstat: 'ACCEPTED', clicked: true },
      { email: 'other3@example.com', partstat: 'DECLINED', clicked: false }
    ];

    this.initDirective(this.$scope);
    var attendeesMailTest = 'other1@example.com,other2@example.com,other3@example.com';

    expect(this.eleScope.vm.attendeesMail).to.equal(attendeesMailTest);
  });
});
