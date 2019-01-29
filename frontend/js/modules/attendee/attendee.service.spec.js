'use strict';

/* global chai: false, sinon: false */

var expect = chai.expect;

describe.skiip('The attendeeService service', function() {
  var $rootScope, attendeeService, query, limit, ESN_ATTENDEE_DEFAULT_TEMPLATE_URL, ESN_ATTENDEE_DEFAULT_OBJECT_TYPE;

  beforeEach(angular.mock.module('esn.attendee'));

  beforeEach(angular.mock.inject(function(_$rootScope_, _attendeeService_, _ESN_ATTENDEE_DEFAULT_TEMPLATE_URL_, _ESN_ATTENDEE_DEFAULT_OBJECT_TYPE_) {
    $rootScope = _$rootScope_;
    attendeeService = _attendeeService_;
    ESN_ATTENDEE_DEFAULT_TEMPLATE_URL = _ESN_ATTENDEE_DEFAULT_TEMPLATE_URL_;
    ESN_ATTENDEE_DEFAULT_OBJECT_TYPE = _ESN_ATTENDEE_DEFAULT_OBJECT_TYPE_;
  }));

  beforeEach(function() {
    query = 'aQuery';
    limit = 50;
  });

  describe('The addProvider method', function() {

    it('should not add an undefined provider', function(done) {
      attendeeService.addProvider();
      attendeeService.getAttendeeCandidates(query, limit).then(function(attendeeCandidates) {
        expect(attendeeCandidates).to.deep.equal([]);
        done();
      }, done);

      $rootScope.$apply();
    });

    it('should not add a provider having no searchAttendee field', function(done) {
      attendeeService.addProvider({_id: 'provider'});
      attendeeService.getAttendeeCandidates(query, limit).then(function(attendeeCandidates) {
        expect(attendeeCandidates).to.deep.equal([]);
        done();
      }, done);

      $rootScope.$apply();
    });

    it('should set the provider objectType to ESN_ATTENDEE_DEFAULT_OBJECT_TYPE when not defined', function() {
      attendeeService.addProvider({_id: 'provider', searchAttendee: function() {}});

      expect(attendeeService.getProviders()[0].objectType).to.deep.equals(ESN_ATTENDEE_DEFAULT_OBJECT_TYPE);
      $rootScope.$apply();
    });

    it('should set the provider objectType to ESN_ATTENDEE_DEFAULT_OBJECT_TYPE when null', function() {
      attendeeService.addProvider({_id: 'provider', objectType: null, searchAttendee: function() {}});

      expect(attendeeService.getProviders()[0].objectType).to.deep.equals(ESN_ATTENDEE_DEFAULT_OBJECT_TYPE);
      $rootScope.$apply();
    });

    it('should not modify the provider objectType when defined', function() {
      var objectType = 'foo';

      attendeeService.addProvider({_id: 'provider', objectType: objectType, searchAttendee: function() {}});

      expect(attendeeService.getProviders()[0].objectType).to.equals(objectType);
      $rootScope.$apply();
    });

    it('should add a provider', function(done) {
      var spy = sinon.spy(function() { return $q.reject(); }),
          newProvider = {_id: 'provider', searchAttendee: spy};

      attendeeService.addProvider(newProvider);
      attendeeService.getAttendeeCandidates(query, limit).then(function() {
        expect(spy).to.have.been.called;
        done();
      }, done);

      $rootScope.$apply();
    });

    it('should honor provider priority over unprioritized providers', function(done) {
      attendeeService.addProvider({ searchAttendee: sinon.stub().returns($q.when([{ email: 'attendee1' }])) });
      attendeeService.addProvider({ priority: 1, searchAttendee: sinon.stub().returns($q.when([{ email: 'attendee2' }])) });
      attendeeService.getAttendeeCandidates({}).then(function(attendees) {
        expect(attendees).to.shallowDeepEqual([{ email: 'attendee2' }, { email: 'attendee1' }]);

        done();
      }, done);

      $rootScope.$apply();
    });

    it('should honor provider priority over lower priority providers', function(done) {
      attendeeService.addProvider({ priority: 1, searchAttendee: sinon.stub().returns($q.when([{ email: 'attendee1' }])) });
      attendeeService.addProvider({ priority: 2, searchAttendee: sinon.stub().returns($q.when([{ email: 'attendee2' }])) });
      attendeeService.addProvider({ searchAttendee: sinon.stub().returns($q.when([{ email: 'attendee3' }])) });
      attendeeService.getAttendeeCandidates({}).then(function(attendees) {
        expect(attendees).to.shallowDeepEqual([{ email: 'attendee2' }, { email: 'attendee1' }, { email: 'attendee3' }]);

        done();
      }, done);

      $rootScope.$apply();
    });

  });

  describe('The getAttendeeCandidates method', function() {
    var attendees1, attendees2, attendees3;

    function getTestProvider(attendeeResult, templateUrl, objectType) {
      return {
        searchAttendee: function(q, l) {
          expect(q).to.equal(query);
          expect(l).to.equal(limit);

          return $q.when(attendeeResult);
        },
        templateUrl: templateUrl,
        objectType: objectType
      };
    }

    beforeEach(function() {
      attendees1 = [{_id: 'attendee1', displayName: 'yolo'}, {_id: 'attendee2', displayName: 'yala'}];
      attendees2 = [{_id: 'attendee3', email: 'yolo@yala.com'}];
      attendees3 = [{_id: 'attendee4', email: 'foo@bar.com'}];
    });

    it('should call providers and return their aggregated values, setting template urls correctly', function(done) {
      attendeeService.addProvider(getTestProvider(attendees1));
      attendeeService.addProvider(getTestProvider([]));
      attendeeService.addProvider(getTestProvider(attendees2, '/views/yolo.html'));

      attendeeService.getAttendeeCandidates(query, limit).then(function(attendeeCandidates) {
        expect(attendeeCandidates).to.shallowDeepEqual([
          {_id: 'attendee1', displayName: 'yolo', templateUrl: ESN_ATTENDEE_DEFAULT_TEMPLATE_URL },
          {_id: 'attendee2', displayName: 'yala', templateUrl: ESN_ATTENDEE_DEFAULT_TEMPLATE_URL },
          {_id: 'attendee3', email: 'yolo@yala.com', templateUrl: '/views/yolo.html' }
        ]);
        done();
      }, done);

      $rootScope.$apply();
    });

    it('should only call providers defined by the objectTypes argument', function(done) {
      var objectTypes = ['resource'];

      attendeeService.addProvider(getTestProvider(attendees1));
      attendeeService.addProvider(getTestProvider([]));
      attendeeService.addProvider(getTestProvider(attendees2, '/views/yolo.html'));
      attendeeService.addProvider(getTestProvider(attendees3, '/views/onlycallme.html', objectTypes[0]));

      attendeeService.getAttendeeCandidates(query, limit, objectTypes).then(function(attendeeCandidates) {
        expect(attendeeCandidates).to.shallowDeepEqual([
          { _id: 'attendee4', email: 'foo@bar.com', templateUrl: '/views/onlycallme.html' }
        ]);
        done();
      }, done);

      $rootScope.$apply();
    });

    it('should call user providers when objectType argument is not defined', function(done) {
      attendeeService.addProvider(getTestProvider(attendees1));
      attendeeService.addProvider(getTestProvider([]));
      attendeeService.addProvider(getTestProvider(attendees2, '/views/yolo.html'));
      attendeeService.addProvider(getTestProvider(attendees3, '/views/willnocallme.html', 'resource'));

      attendeeService.getAttendeeCandidates(query, limit).then(function(attendeeCandidates) {
        expect(attendeeCandidates).to.shallowDeepEqual([
          {_id: 'attendee1', displayName: 'yolo', templateUrl: ESN_ATTENDEE_DEFAULT_TEMPLATE_URL },
          {_id: 'attendee2', displayName: 'yala', templateUrl: ESN_ATTENDEE_DEFAULT_TEMPLATE_URL },
          {_id: 'attendee3', email: 'yolo@yala.com', templateUrl: '/views/yolo.html' }
        ]);
        done();
      }, done);

      $rootScope.$apply();
    });

    it('should set objectType on attendees from the provider objectType', function(done) {
      var objectType = 'resource';
      attendeeService.addProvider(getTestProvider(attendees1));
      attendeeService.addProvider(getTestProvider([]));
      attendeeService.addProvider(getTestProvider(attendees2, '/views/yolo.html', objectType));
      attendeeService.addProvider(getTestProvider(attendees3, '/views/willnocallme.html'));

      attendeeService.getAttendeeCandidates(query, limit, [ESN_ATTENDEE_DEFAULT_OBJECT_TYPE, objectType]).then(function(attendeeCandidates) {
        expect(attendeeCandidates).to.shallowDeepEqual([
          {_id: 'attendee1', displayName: 'yolo', templateUrl: ESN_ATTENDEE_DEFAULT_TEMPLATE_URL, objectType: ESN_ATTENDEE_DEFAULT_OBJECT_TYPE},
          {_id: 'attendee2', displayName: 'yala', templateUrl: ESN_ATTENDEE_DEFAULT_TEMPLATE_URL, objectType: ESN_ATTENDEE_DEFAULT_OBJECT_TYPE },
          {_id: 'attendee3', email: 'yolo@yala.com', templateUrl: '/views/yolo.html', objectType: objectType }
        ]);
        done();
      }, done);

      $rootScope.$apply();
    });

    it('should call no one when providers objectType does not match with input one', function(done) {
      attendeeService.addProvider(getTestProvider(attendees1));
      attendeeService.addProvider(getTestProvider([]));
      attendeeService.addProvider(getTestProvider(attendees2, '/views/yolo.html'));
      attendeeService.addProvider(getTestProvider(attendees3, '/views/willnocallme.html', 'resource'));

      attendeeService.getAttendeeCandidates(query, limit, ['foo', 'bar', 'baz']).then(function(attendeeCandidates) {
        expect(attendeeCandidates).to.be.empty;
        done();
      }, done);

      $rootScope.$apply();
    });

    it('should remove duplicated attendees (check by email)', function(done) {
      var attendee1 = { _id: 1, email: 'duplicate@email' };
      var attendee2 = { _id: 2, email: 'att2@email' };
      var attendee3 = { _id: 3, email: 'duplicate@email' };

      attendeeService.addProvider(getTestProvider([attendee1]));
      attendeeService.addProvider(getTestProvider([attendee2, attendee3]));

      attendeeService.getAttendeeCandidates(query, limit)
      .then(function(attendeeCandidates) {
        expect(attendeeCandidates).to.deep.equal([attendee1, attendee2]);
        done();
      })
      .catch(done);

      $rootScope.$digest();
    });

    it('should remove duplicated attendees who have no email but duplicate displayName', function(done) {
      var attendee1 = { _id: 1, displayName: 'duplicate' };
      var attendee2 = { _id: 2, displayName: 'att2' };
      var attendee3 = { _id: 3, displayName: 'duplicate' };

      attendeeService.addProvider(getTestProvider([attendee1]));
      attendeeService.addProvider(getTestProvider([attendee2, attendee3]));

      attendeeService.getAttendeeCandidates(query, limit)
      .then(function(attendeeCandidates) {
        expect(attendeeCandidates).to.deep.equal([attendee1, attendee2]);
        done();
      })
      .catch(done);

      $rootScope.$digest();
    });

    it('should keep only one attendee having no email nor displayName', function(done) {
      var attendee1 = { _id: 1 };
      var attendee2 = { _id: 2 };
      var attendee3 = { _id: 3 };

      attendeeService.addProvider(getTestProvider([attendee1]));
      attendeeService.addProvider(getTestProvider([attendee2, attendee3]));

      attendeeService.getAttendeeCandidates(query, limit)
      .then(function(attendeeCandidates) {
        expect(attendeeCandidates).to.deep.equal([attendee1]);
        done();
      })
      .catch(done);

      $rootScope.$digest();
    });
  });
});
