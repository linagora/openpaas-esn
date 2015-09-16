'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The attendees-autocomplete-input component', function() {

  var contactServiceMock, asSession, autoCompleteMax;

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
      }
    };

    var asDomainAPI = {
      getMembers: function(domainId, query) {
        return $q.when({
          data: [
            { _id: '111111', firstname: 'first', lastname: 'last', emails: ['user1@test.com'], preferredEmail: 'user1@test.com' },
            { _id: '222222', emails: ['fist@last'], preferredEmail: 'fist@last' },
            { _id: '333333', firstname: 'john', lastname: 'doe', emails: ['johndoe@test.com'], preferredEmail: 'johndoe@test.com' }
          ],
          domainId: domainId,
          query: query
        });
      }
    };

    contactServiceMock = {};
    autoCompleteMax = 6;

    module('jadeTemplates');
    angular.mock.module('esn.calendar');
    angular.mock.module(function($provide) {
      $provide.value('domainAPI', asDomainAPI);
      $provide.value('session', asSession);
      $provide.value('gracePeriodService', {});
      $provide.value('contactsService', contactServiceMock);
      $provide.constant('AUTOCOMPLETE_MAX_RESULTS', autoCompleteMax);
    });
  });

  beforeEach(angular.mock.inject(function($rootScope, $compile, moment) {
    this.$rootScope = $rootScope;
    this.$scope = this.$rootScope.$new();
    this.moment = moment;
    this.$compile = $compile;

    this.initDirective = function(scope) {
      var html = '<attendees-autocomplete-input original-attendees="attendees" mutable-attendees="newAttendees"/>';
      var element = this.$compile(html)(scope);
      scope.$digest();
      this.eleScope = element.isolateScope();
      return element;
    };
  }));

  describe('getInvitableAttendees', function() {
    var query = 'aQuery';

    beforeEach(function() {
      contactServiceMock.searchAllAddressBooks = function(userId, q) {
        expect(userId).to.equal(asSession.user._id);
        expect(q).to.equal(query);
        return $q.when({
          hits_list: [
            { _id: 'contact1', firstname: 'first', lastname: 'last', emails: [{type: 'Work', value: 'user1@test.com'}] },
            { _id: 'contact2', emails: [{type: 'Home', value: 'fist@last'}] }
          ]
        });
      };
    });

    it('should call domainApi and contactService to return displayName and remove session.user', function(done) {
      this.initDirective(this.$scope);
      this.eleScope.getInvitableAttendees(query).then(function(response) {
        expect(response).to.deep.equal([
          { id: '222222', _id: '222222', emails: ['fist@last'], preferredEmail: 'fist@last', displayName: 'fist@last', email: 'fist@last', partstat: 'NEEDS-ACTION', attendeeType: 'user' },
          { id: '333333', _id: '333333', firstname: 'john', lastname: 'doe', 'emails': ['johndoe@test.com'], preferredEmail: 'johndoe@test.com',
            displayName: 'john doe', email: 'johndoe@test.com', partstat: 'NEEDS-ACTION', attendeeType: 'user' },
          { _id: 'contact2', emails: [{type: 'Home', value: 'fist@last'}], email: 'fist@last', attendeeType: 'contact', partstat: 'NEEDS-ACTION' }
        ]);
        done();
      });
      this.$scope.$digest();
    });

    it('should call domainApi and contactService to return displayName and remove added attendees', function(done) {
      this.initDirective(this.$scope);
      this.eleScope.originalAttendees = [{
        email: 'fist@last'
      }];
      this.eleScope.getInvitableAttendees(query).then(function(response) {
        expect(response).to.deep.equal([
          { id: '333333', _id: '333333', firstname: 'john', lastname: 'doe', 'emails': ['johndoe@test.com'], preferredEmail: 'johndoe@test.com',
            displayName: 'john doe', email: 'johndoe@test.com', partstat: 'NEEDS-ACTION', attendeeType: 'user'}
        ]);
        done();
      });
      this.$scope.$digest();
    });

    it('should call domainApi and contactService and return a maximum of AUTOCOMPLETE_MAX_RESULTS results', function(done) {
      contactServiceMock.searchAllAddressBooks = function(userId, q) {
        expect(userId).to.equal(asSession.user._id);
        expect(q).to.equal(query);
        var response = [];
        for (var i = 0; i < 20; i++) {
          response.push({ _id: 'contact' + i, emails: [{type: 'Home', value: i + 'mail@domain.com'}] });
        }
        return $q.when({
          hits_list: response
        });
      };

      this.initDirective(this.$scope);

      this.eleScope.getInvitableAttendees(query).then(function(response) {
        expect(response.length).to.equal(autoCompleteMax);
        done();
      });
      this.$scope.$digest();
    });
  });

  describe('onAddingAttendee', function() {
    it('should support adding external attendees', function() {
      var att, res;
      this.initDirective(this.$scope);

      att = { displayName: 'hello@example.com' };
      res = this.eleScope.onAddingAttendee(att);
      expect(att.email).to.equal('hello@example.com');
      expect(att.displayName).to.equal('hello@example.com');
      expect(res).to.be.true;

      att = { email: 'hello@example.com', displayName: 'world' };
      res = this.eleScope.onAddingAttendee(att);
      expect(att.email).to.equal('hello@example.com');
      expect(att.displayName).to.equal('world');
      expect(res).to.be.true;

      att = { emails: ['hello@example.com'], displayName: 'world' };
      res = this.eleScope.onAddingAttendee(att);
      expect(att.emails).to.deep.equal(['hello@example.com']);
      expect(att.displayName).to.equal('world');
      expect(res).to.be.true;
    });

    it('should bail on already added attendees', function() {
      var att, res;
      this.initDirective(this.$scope);
      this.$scope.newAttendees = [{ email: 'hello@example.com' }];
      this.$scope.$digest();

      att = { displayName: 'hello@example.com' };
      res = this.eleScope.onAddingAttendee(att);
      expect(res).to.be.false;

      att = { email: 'hello@example.com', displayName: 'world' };
      res = this.eleScope.onAddingAttendee(att);
      expect(res).to.be.false;
    });

    it('should bail on already existing attendees in editedEvent', function() {
      var att, res;
      this.$scope.attendees = [{email: 'hello@example.com'}];
      this.initDirective(this.$scope);
      att = { displayName: 'hello@example.com' };
      res = this.eleScope.onAddingAttendee(att);
      expect(res).to.be.false;

      att = { email: 'hello@example.com', displayName: 'world' };
      res = this.eleScope.onAddingAttendee(att);
      expect(res).to.be.false;
    });

    it('should bail on invalid emails', function() {
      var att, res;
      this.initDirective(this.$scope);

      att = { displayName: 'aaaaaaaaaarrrggghhhh' };
      res = this.eleScope.onAddingAttendee(att);
      expect(res).to.be.false;

      att = { email: 'wooooohooooooooo', displayName: 'world' };
      res = this.eleScope.onAddingAttendee(att);
      expect(res).to.be.false;
    });
  });

});
