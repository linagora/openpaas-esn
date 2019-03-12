'use strict';

/* global chai: false, sinon: false */

var expect = chai.expect;

describe('The attendeeService service', function() {
  var $rootScope, attendeeService, esnPeopleAPI, query, limit, ESN_ATTENDEE_DEFAULT_TEMPLATE_URL, ESN_ATTENDEE_DEFAULT_OBJECT_TYPE;

  beforeEach(angular.mock.module('esn.attendee'));

  beforeEach(angular.mock.inject(function(_$rootScope_, _attendeeService_, _esnPeopleAPI_, _ESN_ATTENDEE_DEFAULT_TEMPLATE_URL_, _ESN_ATTENDEE_DEFAULT_OBJECT_TYPE_) {
    $rootScope = _$rootScope_;
    attendeeService = _attendeeService_;
    esnPeopleAPI = _esnPeopleAPI_;
    ESN_ATTENDEE_DEFAULT_TEMPLATE_URL = _ESN_ATTENDEE_DEFAULT_TEMPLATE_URL_;
    ESN_ATTENDEE_DEFAULT_OBJECT_TYPE = _ESN_ATTENDEE_DEFAULT_OBJECT_TYPE_;
  }));

  beforeEach(function() {
    query = 'aQuery';
    limit = 50;
  });

  describe('The addProvider method', function() {
    it('should not add an undefined provider', function() {
      attendeeService.addProvider();

      expect(attendeeService.getProviders()).to.be.empty;
    });

    it('should set the provider objectType to ESN_ATTENDEE_DEFAULT_OBJECT_TYPE when not defined', function() {
      attendeeService.addProvider({_id: 'provider'});

      expect(attendeeService.getProviders()[0].objectType).to.deep.equals(ESN_ATTENDEE_DEFAULT_OBJECT_TYPE);
    });

    it('should set the provider objectType to ESN_ATTENDEE_DEFAULT_OBJECT_TYPE when null', function() {
      attendeeService.addProvider({_id: 'provider', objectType: null, searchAttendee: function() {}});

      expect(attendeeService.getProviders()[0].objectType).to.deep.equals(ESN_ATTENDEE_DEFAULT_OBJECT_TYPE);
    });

    it('should not modify the provider objectType when defined', function() {
      var objectType = 'foo';

      attendeeService.addProvider({_id: 'provider', objectType: objectType});

      expect(attendeeService.getProviders()[0].objectType).to.equals(objectType);
    });
  });

  describe('The getAttendeeCandidates method', function() {
    var attendee1, attendee2, attendee3;

    function getTestProvider(templateUrl, objectType) {
      return {
        templateUrl: templateUrl,
        objectType: objectType
      };
    }

    beforeEach(function() {
      attendee1 = {_id: 'attendee1', objectType: 'user', emailAddresses: [{value: 'attendee1@open-paas.org' }], names: [{ displayName: 'Bruce Lee'}], photos: [{ url: '/foo/bar/attendee1.png' }]};
      attendee2 = {_id: 'attendee2', objectType: 'contact', emailAddresses: [{value: 'attendee2@open-paas.org' }], names: [{ displayName: 'Bruce Willis'}], photos: [{ url: '/foo/bar/attendee1.png' }]};
      attendee3 = {_id: 'attendee3', objectType: 'ldap', emailAddresses: [{value: 'attendee3@open-paas.org' }], names: [{ displayName: 'Walker'}], photos: [{ url: '/foo/bar/attendee1.png' }]};
    });

    it('should set template urls correctly', function(done) {
      var people = [attendee1, attendee2];
      var stub = sinon.stub(esnPeopleAPI, 'search');
      var objectTypes = ['user', 'contact', 'ldap'];

      stub.returns($q.when(people));

      attendeeService.addProvider(getTestProvider('/template/user', 'user'));
      attendeeService.addProvider(getTestProvider(null, 'contact'));

      attendeeService.getAttendeeCandidates(query, limit, objectTypes).then(function(attendeeCandidates) {
        expect(stub).to.has.been.calledWith(query, objectTypes, limit);
        expect(attendeeCandidates).to.shallowDeepEqual([
          {_id: 'attendee1', displayName: 'Bruce Lee', templateUrl: '/template/user' },
          {_id: 'attendee2', displayName: 'Bruce Willis', templateUrl: ESN_ATTENDEE_DEFAULT_TEMPLATE_URL }
        ]);
        done();
      }, done);

      $rootScope.$apply();
    });

    it('should set email, preferredEmail, displayName and avatarUrl from people API response', function(done) {
      var people = [attendee1, attendee2];
      var stub = sinon.stub(esnPeopleAPI, 'search');
      var objectTypes = ['user', 'contact', 'ldap'];

      stub.returns($q.when(people));

      attendeeService.addProvider(getTestProvider('/template/user', 'user'));
      attendeeService.addProvider(getTestProvider(null, 'contact'));

      attendeeService.getAttendeeCandidates(query, limit, objectTypes).then(function(attendeeCandidates) {
        expect(stub).to.has.been.calledWith(query, objectTypes, limit);
        expect(attendeeCandidates).to.shallowDeepEqual([
          {displayName: attendee1.names[0].displayName, avatarUrl: attendee1.photos[0].url, email: attendee1.emailAddresses[0].value, preferredEmail: attendee1.emailAddresses[0].value },
          {displayName: attendee2.names[0].displayName, avatarUrl: attendee2.photos[0].url, email: attendee2.emailAddresses[0].value, preferredEmail: attendee2.emailAddresses[0].value }
        ]);
        done();
      }, done);

      $rootScope.$apply();
    });

    it('should call default provider when objectType argument is not defined', function(done) {
      var people = [attendee1, attendee2];
      var stub = sinon.stub(esnPeopleAPI, 'search');

      stub.returns($q.when(people));

      attendeeService.addProvider(getTestProvider('/template/user', 'user'));
      attendeeService.addProvider(getTestProvider(null, 'contact'));

      attendeeService.getAttendeeCandidates(query, limit).then(function(attendeeCandidates) {
        expect(stub).to.has.been.calledWith(query, [ESN_ATTENDEE_DEFAULT_OBJECT_TYPE], limit);
        expect(attendeeCandidates).to.shallowDeepEqual([
          {_id: 'attendee1', displayName: 'Bruce Lee', templateUrl: '/template/user' },
          {_id: 'attendee2', displayName: 'Bruce Willis', templateUrl: ESN_ATTENDEE_DEFAULT_TEMPLATE_URL }
        ]);
        done();
      }, done);

      $rootScope.$apply();
    });

    describe('When no attendeesFilter is defined', function() {
      it('should remove duplicated attendees (check by email)', function(done) {
        attendee1.emailAddresses[0].value = 'duplicate@open-paas.org';
        attendee2.emailAddresses[0].value = 'notduplicate@open-paas.org';
        attendee3.emailAddresses[0].value = 'duplicate@open-paas.org';

        var people = [attendee1, attendee2, attendee3];
        var stub = sinon.stub(esnPeopleAPI, 'search');
        var objectTypes = ['user', 'contact', 'ldap'];

        stub.returns($q.when(people));

        attendeeService.getAttendeeCandidates(query, limit, objectTypes).then(function(attendeeCandidates) {
          expect(stub).to.has.been.calledWith(query, objectTypes, limit);
          expect(attendeeCandidates).to.shallowDeepEqual([
            {_id: 'attendee1', displayName: 'Bruce Lee' },
            {_id: 'attendee2', displayName: 'Bruce Willis'}
          ]);
          done();
        }, done);

        $rootScope.$apply();
      });

      it('should remove duplicated attendees who have no email but duplicate displayName', function(done) {
        attendee1.names[0].displayName = 'Me';
        attendee2.names[0].displayName = 'You';
        attendee3.names[0].displayName = 'Me';

        var people = [attendee1, attendee2, attendee3];
        var stub = sinon.stub(esnPeopleAPI, 'search');
        var objectTypes = ['user', 'contact', 'ldap'];

        stub.returns($q.when(people));

        attendeeService.getAttendeeCandidates(query, limit, objectTypes).then(function(attendeeCandidates) {
          expect(stub).to.has.been.calledWith(query, objectTypes, limit);
          expect(attendeeCandidates).to.shallowDeepEqual([
            {_id: 'attendee1', displayName: 'Me' },
            {_id: 'attendee2', displayName: 'You'}
          ]);
          done();
        }, done);

        $rootScope.$apply();
      });

      it('should keep only one attendee having no email nor displayName', function(done) {
        var attendee1 = { _id: 1 };
        var attendee2 = { _id: 2 };
        var attendee3 = { _id: 3 };

        var people = [attendee1, attendee2, attendee3];
        var stub = sinon.stub(esnPeopleAPI, 'search');

        stub.returns($q.when(people));

        attendeeService.getAttendeeCandidates(query, limit)
        .then(function(attendeeCandidates) {
          expect(attendeeCandidates).to.deep.equal([attendee1]);
          done();
        })
        .catch(done);

        $rootScope.$digest();
      });
    });

    describe('When attendeesFilter is defined', function() {
      it('should call and return results from it', function(done) {
        var attendee1 = { _id: 1 };
        var attendee2 = { _id: 2 };
        var attendee3 = { _id: 3 };
        var filterResult = [{ _id: 4 }, { _id: 5 }];

        var people = [attendee1, attendee2, attendee3];
        var searchStub = sinon.stub(esnPeopleAPI, 'search');
        var filterAttendees = sinon.stub().returns(filterResult);

        searchStub.returns($q.when(people));

        attendeeService.getAttendeeCandidates(query, limit, null, [], filterAttendees)
          .then(function(attendeeCandidates) {
            expect(searchStub).to.have.been.calledOnce;
            expect(filterAttendees).to.have.been.calledOnce;
            expect(attendeeCandidates).to.deep.equal(filterResult);
            done();
          })
          .catch(done);

        $rootScope.$digest();
      });
    });
  });
});
