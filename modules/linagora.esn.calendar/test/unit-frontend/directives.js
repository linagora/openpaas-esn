'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The Calendar Angular module directives', function() {

  beforeEach(function() {
    var asSession = {
      user: {
        _id: '123456',
        emails: ['user1@test.com']
      },
      domain: {
        company_name: 'test',
        _id: 'domainId'
      }
    };

    var asDomainAPI = {
      getMembers: function(domainId, query) {
        return {
          then: function(onSuccess) {
            var response = {
              data: [
                { _id: '111111', firstname: 'first', lastname: 'last', emails: ['user1@test.com'] },
                { _id: '222222', emails: ['fist@last'] },
                { _id: '333333', firstname: 'john', lastname: 'doe', emails: ['johndoe@test.com'] }
              ],
              domainId: domainId,
              query: query
            };
            onSuccess(response);
          }
        };
      }
    };

    module('jadeTemplates');
    angular.mock.module('esn.calendar');
    angular.mock.module(function($provide) {
      $provide.value('domainAPI', asDomainAPI);
      $provide.value('session', asSession);
    });
  });

  describe('The eventForm directive', function() {
    beforeEach(inject(['$compile', '$rootScope', 'moment', 'calendarUtils', function($c, $r, moment, calendarUtils) {
      this.$compile = $c;
      this.$rootScope = $r;
      this.$scope = this.$rootScope.$new();
      this.moment = moment;
      this.calendarUtils = calendarUtils;

      this.initDirective = function(scope) {
        var html = '<event-quick-form/>';
        var element = this.$compile(html)(scope);
        scope.$digest();
        return element;
      };
    }]));


    it('should initiate $scope.editedEvent from $scope.event if it exists with id', function() {
      this.$scope.event = {
        _id: '123456',
        allDay: true,
        attendees: [{'displayName': 'user1@openpaas.org', clicked: false}],
        start: this.moment('2013-02-08 12:30'),
        end: this.moment('2013-02-08 13:30')
      };
      this.initDirective(this.$scope);
      expect(this.$scope.editedEvent).to.shallowDeepEqual({
        _id: '123456',
        allDay: true,
        attendees: [{'displayName': 'user1@openpaas.org'}],
        diff: 3600000
      });
    });

    it('should initiate $scope.editedEvent with list of attendees ', function() {
      this.$scope.event = {
        _id: '123456',
        allDay: true,
        attendees: [{'displayName': 'user1@openpaas.org'}],
        start: this.moment('2013-02-08 12:30'),
        end: this.moment('2013-02-08 13:30')
      };
      this.initDirective(this.$scope);
      expect(this.$scope.editedEvent).to.shallowDeepEqual({
        _id: '123456',
        allDay: true,
        attendees: [{'displayName': 'user1@openpaas.org', clicked: false}],
        diff: 3600000
      });
    });


    it('should initiate $scope.editedEvent with default values if $scope.event does not exists', function() {
      this.initDirective(this.$scope);
      expect(this.moment(this.$scope.editedEvent.start).isSame(this.calendarUtils.getNewStartDate())).to.be.true;
      expect(this.moment(this.$scope.editedEvent.end).isSame(this.calendarUtils.getNewEndDate())).to.be.true;
      expect(this.$scope.editedEvent.allDay).to.be.false;
    });

    it('should have a getInvitableAttendees method that call domainApi to return displayName and remove session.user', function(done) {
      this.initDirective(this.$scope);
      this.$scope.getInvitableAttendees('aQuery').then(function(response) {
        expect(response).to.deep.equal([
          { id: '222222', _id: '222222', emails: ['fist@last'], displayName: 'fist@last', email: 'fist@last', partstat: 'NEEDS-ACTION' },
          { id: '333333', _id: '333333', firstname: 'john', lastname: 'doe', 'emails': ['johndoe@test.com'],
            displayName: 'john doe', email: 'johndoe@test.com', partstat: 'NEEDS-ACTION'}
        ]);
        done();
      });
      this.$scope.$digest();
    });

    it('should have a getInvitableAttendees method that call domainApi to return displayName and remove added attendees', function(done) {
      this.initDirective(this.$scope);
      this.$scope.editedEvent.attendees = [{
        email: 'fist@last'
      }];
      this.$scope.getInvitableAttendees('aQuery').then(function(response) {
        expect(response).to.deep.equal([
          { id: '333333', _id: '333333', firstname: 'john', lastname: 'doe', 'emails': ['johndoe@test.com'],
            displayName: 'john doe', email: 'johndoe@test.com', partstat: 'NEEDS-ACTION'}
        ]);
        done();
      });
      this.$scope.$digest();
    });

    describe('the onAddingAttendee fn', function() {
      it('should support adding external attendees', function() {
        var att, res;
        this.initDirective(this.$scope);

        att = { displayName: 'hello@example.com' };
        res = this.$scope.onAddingAttendee(att);
        expect(att.email).to.equal('hello@example.com');
        expect(att.displayName).to.equal('hello@example.com');
        expect(res).to.be.true;

        att = { email: 'hello@example.com', displayName: 'world' };
        res = this.$scope.onAddingAttendee(att);
        expect(att.email).to.equal('hello@example.com');
        expect(att.displayName).to.equal('world');
        expect(res).to.be.true;

        att = { emails: ['hello@example.com'], displayName: 'world' };
        res = this.$scope.onAddingAttendee(att);
        expect(att.emails).to.deep.equal(['hello@example.com']);
        expect(att.displayName).to.equal('world');
        expect(res).to.be.true;
      });

      it('should bail on already added attendees', function() {
        var att, res;
        this.initDirective(this.$scope);
        this.$scope.newAttendees = [{ email: 'hello@example.com' }];

        att = { displayName: 'hello@example.com' };
        res = this.$scope.onAddingAttendee(att);
        expect(res).to.be.false;

        att = { email: 'hello@example.com', displayName: 'world' };
        res = this.$scope.onAddingAttendee(att);
        expect(res).to.be.false;
      });

      it('should bail on invalid emails', function() {
        var att, res;
        this.initDirective(this.$scope);

        att = { displayName: 'aaaaaaaaaarrrggghhhh' };
        res = this.$scope.onAddingAttendee(att);
        expect(res).to.be.false;

        att = { email: 'wooooohooooooooo', displayName: 'world' };
        res = this.$scope.onAddingAttendee(att);
        expect(res).to.be.false;
      });
    });
  });

  describe('The friendlifyEndDate directive', function() {

    beforeEach(inject(['$compile', '$rootScope', 'moment', function($c, $r, moment) {
      this.$compile = $c;
      this.$rootScope = $r;
      this.$scope = this.$rootScope.$new();
      this.moment = moment;

      this.initDirective = function(scope) {
        var html = '<input ng-model="editedEvent.end" friendlify-end-date/>';
        var element = this.$compile(html)(scope);
        scope.$digest();
        return element;
      };
    }]));

    it('should have a first formatters that output the date -1 day if editedEvent is a allday', function() {
      this.$scope.editedEvent = {
        allDay: true,
        end: this.moment('2015-07-03')
      };
      var element = this.initDirective(this.$scope);
      var controller = element.controller('ngModel');
      expect(controller.$viewValue).to.deep.equal('2015/07/02');
    });

    it('should have a first formatters that do nothing if editedEvent is not allday', function() {
      this.$scope.editedEvent = {
        allDay: false
      };
      var element = this.initDirective(this.$scope);
      var formatter = element.controller('ngModel').$formatters[0];
      expect(formatter('2015/07/03')).to.deep.equal('2015/07/03');
    });

    it('should have a last parsers that add 1 day if editedEvent is allday', function() {
      this.$scope.editedEvent = {
        allDay: true
      };
      var element = this.initDirective(this.$scope);
      var parser = element.controller('ngModel').$parsers[0];
      expect(parser(this.moment('2015/07/03')).format('YYYY/MM/DD')).to.deep.equal(this.moment('2015/07/04').format('YYYY/MM/DD'));
    });

    it('should have a last parsers that do nothing if editedEvent is not allday', function() {
      this.$scope.editedEvent = {
        allDay: false
      };
      var element = this.initDirective(this.$scope);
      var parser = element.controller('ngModel').$parsers[0];
      expect(parser(this.moment('2015/07/03')).format('YYYY/MM/DD')).to.deep.equal(this.moment('2015/07/03').format('YYYY/MM/DD'));
    });
  });
});
