'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The mail-to-attendees component', function() {

  var attendeesTest, attendeesMailTest;

  beforeEach(function() {
    attendeesTest = [
      { email: 'other1@example.com', partstat: 'NEEDS-ACTION', clicked: false },
      { email: 'other2@example.com', partstat: 'ACCEPTED', clicked: true },
      { email: 'other3@example.com', partstat: 'DECLINED', clicked: false }
    ];

    attendeesMailTest = 'other1@example.com,other2@example.com,other3@example.com';

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
    this.initDirective(this.$scope);

    expect(this.eleScope.vm.getEmailAddressesFromUsers(attendeesTest)).to.equal(attendeesMailTest);
  });

  it('should initialize mail-to-attendees without duplicates', function() {
    var attendees = angular.copy(attendeesTest);

    attendees.push(attendeesTest[1]);

    this.initDirective(this.$scope);

    expect(this.eleScope.vm.getEmailAddressesFromUsers(attendees)).to.equal(attendeesMailTest);
  });
});
