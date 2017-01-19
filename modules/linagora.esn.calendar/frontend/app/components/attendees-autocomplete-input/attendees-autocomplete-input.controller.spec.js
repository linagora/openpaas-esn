'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The calAttendeesAutocompleteInputController', function() {

  var $rootScope, $scope, $controller, calendarAttendeeService, session, calEventsProviders, AUTOCOMPLETE_MAX_RESULTS;

  beforeEach(function() {
    session = {
      user: {
        _id: '123456',
        emails: ['user1@test.com'],
        emailMap: {'user1@test.com': true}
      },
      domain: {
        company_name: 'test',
        _id: 'domainId'
      },
      ready: {
        then: function() {
        }
      }
    };

    calendarAttendeeService = {
      getAttendeeCandidates: function() {
        return $q.when([
          {
            id: '111111',
            firstname: 'first',
            lastname: 'last',
            email: 'user1@test.com',
            preferredEmail: 'user1@test.com',
            partstat: 'NEEDS-ACTION'
          },
          {
            displayName: 'contact3',
            id: '222222',
            email: 'fist@last',
            preferredEmail: 'fist@last',
            partstat: 'NEEDS-ACTION'
          },
          {
            displayName: 'contact1',
            id: '333333',
            firstname: 'john',
            lastname: 'doe',
            email: 'johndoe@test.com',
            preferredEmail: 'johndoe@test.com',
            partstat: 'NEEDS-ACTION'
          },
          {displayName: 'contact20', id: '444444', email: '4@last', preferredEmail: '4@last', partstat: 'NEEDS-ACTION'}
        ]);
      }
    };

    calEventsProviders = function() {
      return {
        setUpSearchProviders: function() {
        }
      };
    };

    AUTOCOMPLETE_MAX_RESULTS = 6;

    angular.mock.module('esn.calendar', function($provide) {
      $provide.value('calendarAttendeeService', calendarAttendeeService);
      $provide.value('session', session);
      $provide.factory('calEventsProviders', calEventsProviders);
      $provide.constant('AUTOCOMPLETE_MAX_RESULTS', AUTOCOMPLETE_MAX_RESULTS);
    });
    angular.mock.inject(function(_$rootScope_, _$controller_, _calendarAttendeeService_, _session_, _AUTOCOMPLETE_MAX_RESULTS_) {
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      $controller = _$controller_;
      calendarAttendeeService = _calendarAttendeeService_;
      session = _session_;
      AUTOCOMPLETE_MAX_RESULTS = _AUTOCOMPLETE_MAX_RESULTS_;
    });
  });

  function initController(bindings) {
    return $controller('calAttendeesAutocompleteInputController', null, bindings);
  }

  it('should initialize the model, if none given', function() {
    var ctrl = initController();

    expect(ctrl.mutableAttendees).to.deep.equal([]);
  });

  it('should use the model, if one given', function() {
    var bindings = {mutableAttendees: [{a: '1'}]};
    var ctrl = initController(bindings);

    expect(ctrl.mutableAttendees).to.deep.equal([{a: '1'}]);
  });

  describe('getInvitableAttendees', function() {
    var query = 'aQuery';

    it('should call calendarAttendeeService, remove session.user and sort the other users based on the displayName property ', function(done) {
      var ctrl = initController();

      ctrl.getInvitableAttendees(query).then(function(response) {
        expect(response).to.deep.equal([
          {
            displayName: 'contact1',
            id: '333333',
            firstname: 'john',
            lastname: 'doe',
            email: 'johndoe@test.com',
            preferredEmail: 'johndoe@test.com',
            partstat: 'NEEDS-ACTION'
          },
          {
            displayName: 'contact3',
            id: '222222',
            email: 'fist@last',
            preferredEmail: 'fist@last',
            partstat: 'NEEDS-ACTION'
          },
          {displayName: 'contact20', id: '444444', email: '4@last', preferredEmail: '4@last', partstat: 'NEEDS-ACTION'}
        ]);
        done();
      });
      $scope.$digest();
    });

    it('should remove duplicate attendees based on ID comparing to added attendees', function(done) {
      var ctrl = initController();

      ctrl.originalAttendees = [{
        id: '222222',
        email: 'fist@last'
      }];
      ctrl.getInvitableAttendees(query).then(function(response) {
        expect(response).to.eql([
          {
            displayName: 'contact1',
            id: '333333',
            firstname: 'john',
            lastname: 'doe',
            email: 'johndoe@test.com',
            preferredEmail: 'johndoe@test.com',
            partstat: 'NEEDS-ACTION'
          },
          {displayName: 'contact20', id: '444444', email: '4@last', preferredEmail: '4@last', partstat: 'NEEDS-ACTION'}
        ]);
        done();
      });
      $scope.$digest();
    });

    it('should call calendarAttendeeService and return a maximum of AUTOCOMPLETE_MAX_RESULTS results', function(done) {
      calendarAttendeeService.getAttendeeCandidates = function(q) {
        expect(q).to.equal(query);
        var response = [];

        for (var i = 0; i < 20; i++) {
          response.push({id: 'contact' + i, email: i + 'mail@domain.com', partstat: 'NEEDS-ACTION'});
        }

        return $q.when(response);
      };

      var ctrl = initController();

      ctrl.getInvitableAttendees(query).then(function(response) {
        expect(response.length).to.equal(AUTOCOMPLETE_MAX_RESULTS);
        done();
      });
      $scope.$digest();
    });
  });

  describe('onAddingAttendee', function() {
    it('should work with attendee having an email', function() {
      var att, res;
      var ctrl = initController();

      att = {id: 1, displayName: 'yolo', email: 'yolo@open-paas.org'};
      res = ctrl.onAddingAttendee(att);
      expect(res).to.be.true;
    });

    it('should work with attendee without an email', function() {
      var att, res;
      var ctrl = initController();

      att = {displayName: 'eric cartman'};
      res = ctrl.onAddingAttendee(att);
      expect(res).to.be.true;
      expect(att.email).to.be.equal('eric cartman');
    });

    describe('adding plain email attendee', function() {
      it('should use displayName as ID and email', function() {
        var displayName = 'plain@email.com';
        var att = {displayName: displayName};
        var ctrl = initController();

        ctrl.onAddingAttendee(att);
        expect(att).to.eql({
          displayName: displayName,
          id: displayName,
          email: displayName
        });
      });

      it('should return false when trying to add duplicate contact as attendee', function() {
        var duplicateContact = {
          id: '1',
          email: 'duplicate@email.com'
        };
        var ctrl = initController();

        ctrl.originalAttendees = [duplicateContact];
        expect(ctrl.onAddingAttendee(duplicateContact)).to.be.false;
      });

      it('should return false when adding contact with existent id as attendee', function() {
        var duplicateContact = {
          id: '1'
        };
        var ctrl = initController();

        ctrl.originalAttendees = [duplicateContact];
        expect(ctrl.onAddingAttendee(duplicateContact)).to.be.false;
      });

      it('should return false when adding contact with existent email as attendee', function() {
        var duplicateContact = {
          email: 'duplicate@email.com'
        };
        var ctrl = initController();

        ctrl.originalAttendees = [duplicateContact];
        expect(ctrl.onAddingAttendee(duplicateContact)).to.be.false;
      });
    });
  });

});
