'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The attendees-list component', function() {

  beforeEach(function() {
    module('jadeTemplates');
    angular.mock.module('esn.calendar');
  });

  describe('attendeeListItem directive', function() {

    beforeEach(inject(['$compile', '$rootScope', function($c, $r) {
      this.$compile = $c;
      this.$scope = $r.$new();

      this.initDirective = function(scope) {
        var html = '<attendee-list-item attendee="attendee" readonly="readOnly"/>';
        var element = this.$compile(html)(scope);
        scope.$digest();
        return element;
      };
    }]));

    it('should instantiate the attendeeType scope property', function() {
      this.$scope.attendee = {
        email: 'toto@toto.fr',
        name: 'toto'
      };
      var directiveScope = this.initDirective(this.$scope).isolateScope();
      expect(directiveScope.attendeeType).to.equal('user');

      this.$scope.attendee = {
        email: 'toto@toto.fr',
        name: 'toto@toto.fr'
      };
      directiveScope = this.initDirective(this.$scope).isolateScope();
      expect(directiveScope.attendeeType).to.equal('email');
    });
  });

  describe('attendeesList directive', function() {
    beforeEach(angular.mock.inject(function($rootScope, $compile, moment) {
      this.$rootScope = $rootScope;
      this.$scope = this.$rootScope.$new();
      this.moment = moment;
      this.$compile = $compile;

      this.$scope.attendees = [
        { email: 'other1@example.com', partstat: 'NEEDS-ACTION', clicked: false },
        { email: 'other2@example.com', partstat: 'ACCEPTED', clicked: true },
        { email: 'other3@example.com', partstat: 'DECLINED', clicked: false },
        { email: 'other4@example.com', partstat: 'TENTATIVE', clicked: true },
        { email: 'other5@example.com', partstat: 'YOLO' }
      ];

      this.initDirective = function(scope) {
        var html = '<attendees-list attendees="attendees"/>';
        var element = this.$compile(html)(scope);
        scope.$digest();
        this.eleScope = element.isolateScope();
        return element;
      };
    }));

    it('should set up attendee stats correctly', function() {
      this.initDirective(this.$scope);
      expect(this.eleScope.attendeesPerPartstat).to.deep.equal({
        'NEEDS-ACTION': 1,
        'ACCEPTED': 1,
        'TENTATIVE': 1,
        'DECLINED': 1,
        'OTHER': 1
      });
    });

    it('should fire updateAttendeeStats if event:attendees:updated is emited', function() {
      this.initDirective(this.$scope);
      this.$scope.attendees = [
        { email: 'other1@example.com', partstat: 'ACCEPTED', clicked: false },
        { email: 'other2@example.com', partstat: 'ACCEPTED', clicked: true },
        { email: 'other3@example.com', partstat: 'DECLINED', clicked: false },
        { email: 'other4@example.com', partstat: 'DECLINED', clicked: true },
        { email: 'other5@example.com', partstat: 'YOLO' }
      ];
      this.$scope.$digest();
      this.$scope.$broadcast('event:attendees:updated');
      expect(this.eleScope.attendeesPerPartstat).to.deep.equal({
        'NEEDS-ACTION': 0,
        'ACCEPTED': 2,
        'TENTATIVE': 0,
        'DECLINED': 2,
        'OTHER': 1
      });
    });

    describe('scope.selectAttendee', function() {
      it('should set clicked and increase attendee click count', function() {
        var attendee = { email: 'other1@example.com', partstat: 'NEEDS-ACTION' };
        this.initDirective(this.$scope);
        this.eleScope.selectAttendee(attendee);
        expect(attendee.clicked).to.be.true;
        expect(this.eleScope.attendeeClickedCount).to.equal(1);
      });

      it('should unset clicked and decrease attendee click count', function() {
        var attendee = { email: 'other1@example.com', partstat: 'NEEDS-ACTION' };
        this.initDirective(this.$scope);
        this.eleScope.selectAttendee(attendee);
        this.eleScope.selectAttendee(attendee);
        expect(attendee.clicked).to.be.false;
        expect(this.eleScope.attendeeClickedCount).to.equal(0);
      });
    });

    describe('scope.deleteSelectedAttendees', function() {
      it('should filter unclicked attendees', function() {
        this.initDirective(this.$scope);
        this.eleScope.deleteSelectedAttendees();
        expect(this.eleScope.attendees).to.deep.equal([
          { email: 'other1@example.com', partstat: 'NEEDS-ACTION', clicked: false },
          { email: 'other3@example.com', partstat: 'DECLINED', clicked: false },
          { email: 'other5@example.com', partstat: 'YOLO' }
        ]);
      });
    });
  });

});
