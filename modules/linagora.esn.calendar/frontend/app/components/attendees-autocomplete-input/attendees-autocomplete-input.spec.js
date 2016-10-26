'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The cal-attendees-autocomplete-input component', function() {

  var attendeeServiceMock, asSession, autoCompleteMax;

  beforeEach(function() {
    asSession = {
      user: {
        _id: '123456',
        emails: ['user1@test.com'],
        emailMap: { 'user1@test.com': true }
      },
      domain: {
        company_name: 'test',
        _id: 'domainId'
      },
      ready: {
        then: function() {}
      }
    };

    attendeeServiceMock = {
      getAttendeeCandidates: function() {
        return $q.when([
          { id: '111111', firstname: 'first', lastname: 'last', email: 'user1@test.com', preferredEmail: 'user1@test.com', partstat: 'NEEDS-ACTION'},
          { displayName: 'contact3', id: '222222', email: 'fist@last', preferredEmail: 'fist@last', partstat: 'NEEDS-ACTION'},
          { displayName: 'contact1', id: '333333', firstname: 'john', lastname: 'doe', email: 'johndoe@test.com', preferredEmail: 'johndoe@test.com', partstat: 'NEEDS-ACTION'},
          { displayName: 'contact20', id: '444444', email: '4@last', preferredEmail: '4@last', partstat: 'NEEDS-ACTION'}
        ]);
      }
    };

    autoCompleteMax = 6;

    module('jadeTemplates');
    angular.mock.module('esn.calendar');
    angular.mock.module(function($provide) {
      $provide.value('calendarAttendeeService', attendeeServiceMock);
      $provide.value('session', asSession);
      $provide.factory('calEventsProviders', function() {
        return {
          setUpSearchProviders: function() {}
        };
      });
      $provide.constant('AUTOCOMPLETE_MAX_RESULTS', autoCompleteMax);
    });
  });

  beforeEach(angular.mock.inject(function($rootScope, $compile, moment) {
    this.$rootScope = $rootScope;
    this.$scope = this.$rootScope.$new();
    this.moment = moment;
    this.$compile = $compile;

    this.initDirective = function(scope) {
      var html = '<cal-attendees-autocomplete-input original-attendees="attendees" mutable-attendees="newAttendees"/>';
      var element = this.$compile(html)(scope);

      scope.$digest();
      this.eleScope = element.isolateScope();

      return element;
    };
  }));

  it('should initialize the model, if none given', function() {
    this.initDirective(this.$scope);

    expect(this.eleScope.vm.mutableAttendees).to.deep.equal([]);
  });

  it('should use the model, if one given', function() {
    this.$scope.newAttendees = [{ a: '1' }];
    this.initDirective(this.$scope);

    expect(this.eleScope.vm.mutableAttendees).to.deep.equal([{ a: '1' }]);
  });

  describe('getInvitableAttendees', function() {
    var query = 'aQuery';

    it('should call calendarAttendeeService, remove session.user and sort the other users based on the displayName property ', function(done) {
      this.initDirective(this.$scope);
      this.eleScope.vm.getInvitableAttendees(query).then(function(response) {
        expect(response).to.deep.equal([
          { displayName: 'contact1', id: '333333', firstname: 'john', lastname: 'doe', email: 'johndoe@test.com', preferredEmail: 'johndoe@test.com', partstat: 'NEEDS-ACTION'},
          { displayName: 'contact3', id: '222222', email: 'fist@last', preferredEmail: 'fist@last', partstat: 'NEEDS-ACTION'},
          { displayName: 'contact20', id: '444444', email: '4@last', preferredEmail: '4@last', partstat: 'NEEDS-ACTION'}
        ]);
        done();
      });
      this.$scope.$digest();
    });

    it('should remove duplicate attendees based on ID comparing to added attendees', function(done) {
      this.initDirective(this.$scope);
      this.eleScope.vm.originalAttendees = [{
        id: '222222',
        email: 'fist@last'
      }];
      this.eleScope.vm.getInvitableAttendees(query).then(function(response) {
        expect(response).to.eql([
          { displayName: 'contact1', id: '333333', firstname: 'john', lastname: 'doe', email: 'johndoe@test.com', preferredEmail: 'johndoe@test.com', partstat: 'NEEDS-ACTION'},
          { displayName: 'contact20', id: '444444', email: '4@last', preferredEmail: '4@last', partstat: 'NEEDS-ACTION'}
        ]);
        done();
      });
      this.$scope.$digest();
    });

    it('should call calendarAttendeeService and return a maximum of AUTOCOMPLETE_MAX_RESULTS results', function(done) {
      attendeeServiceMock.getAttendeeCandidates = function(q) {
        expect(q).to.equal(query);
        var response = [];

        for (var i = 0; i < 20; i++) {
          response.push({id: 'contact' + i, email: i + 'mail@domain.com', partstat: 'NEEDS-ACTION'});
        }

        return $q.when(response);
      };

      this.initDirective(this.$scope);

      this.eleScope.vm.getInvitableAttendees(query).then(function(response) {
        expect(response.length).to.equal(autoCompleteMax);
        done();
      });
      this.$scope.$digest();
    });
  });

  describe('onAddingAttendee', function() {
    it('should work with attendee having an email', function() {
      var att, res;

      this.initDirective(this.$scope);
      att = { id: 1, displayName: 'yolo', email: 'yolo@open-paas.org' };
      res = this.eleScope.vm.onAddingAttendee(att);
      expect(res).to.be.true;
    });

    it('should work with attendee without an email', function() {
      var att, res;

      this.initDirective(this.$scope);
      att = { displayName: 'eric cartman' };
      res = this.eleScope.vm.onAddingAttendee(att);
      expect(res).to.be.true;
      expect(att.email).to.be.equal('eric cartman');
    });

    describe('adding plain email attendee', function() {
      it('should use displayName as ID and email', function() {
        var displayName = 'plain@email.com';
        var att = { displayName: displayName };

        this.eleScope.vm.onAddingAttendee(att);
        expect(att).to.eql({
          displayName: displayName,
          id: displayName,
          email: displayName
        });
      });

      it('should still return true when there is duplicate email from user/contact attendees', function() {
        var duplicateEmail = 'duplicate@email.com';

        this.eleScope.vm.originalAttendees = [{
          id: '1',
          email: duplicateEmail
        }];
        expect(this.eleScope.vm.onAddingAttendee({ displayName: duplicateEmail })).to.be.true;

      });
    });
  });

});
