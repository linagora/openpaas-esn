'use strict';

/* global chai, sinon, _: false */

var expect = chai.expect;

describe('directive usersAutocompleteInput', function() {
  var session, attendeeService;
  var $compile, $scope, $rootScope;
  var USER_AUTO_COMPLETE_TEMPLATE_URL, AUTOCOMPLETE_MAX_RESULTS;
  var user1, user2, user3;
  var query = 'aQuery';

  beforeEach(function() {
    module('esn.user');
    module('jadeTemplates');

    session = {
      user: {},
      domain: {
        company_name: 'test',
        _id: 'domainId'
      }
    };

    user1 = {_id: 'user1', displayName: 'user1'};
    user3 = {_id: 'user3', displayName: 'user3'};
    user2 = {_id: 'user2', displayName: 'user2'};

    module(function($provide) {
      $provide.value('session', session);
      $provide.value('esnI18nService', {
        translate: function(input) {
          return input;
        }
      });
    });
  });

  beforeEach(function() {
    inject(function(
      _$rootScope_,
      _$compile_,
      _attendeeService_,
      _USER_AUTO_COMPLETE_TEMPLATE_URL_,
      _AUTOCOMPLETE_MAX_RESULTS_
    ) {
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      $compile = _$compile_;
      attendeeService = _attendeeService_;
      USER_AUTO_COMPLETE_TEMPLATE_URL = _USER_AUTO_COMPLETE_TEMPLATE_URL_;
      AUTOCOMPLETE_MAX_RESULTS = _AUTOCOMPLETE_MAX_RESULTS_;
    });
  });

  function initDirective(scope) {
    scope.newUsers = [];
    var html = '<users-autocomplete-input original-users="users" mutable-users="newUsers" />';
    var element = $compile(html)(scope);

    scope.$digest();

    return element;
  }

  describe('The getUsers function', function() {
    it('should call attendeeService function and return an array of users with templateUrl', function(done) {
      var element = initDirective($scope);

      var expectedResult = [user1, user2, user3].map(function(user) {
        return _.assign(user, {_id: user.id}, {templateUrl: USER_AUTO_COMPLETE_TEMPLATE_URL});
      });

      attendeeService.getAttendeeCandidates = sinon.stub().returns($q.when([user1, user2, user3]));

      element.isolateScope().getUsers(query).then(function(result) {
        expect(attendeeService.getAttendeeCandidates).to.have.been.called;
        expect(result).to.shallowDeepEqual(expectedResult);
        done();
      }).catch(done);

      $scope.$digest();
    });

    it('should collect connected user and pass to #getAttendeeCandidates as excluded object by default', function(done) {
      session.user = {
        id: 'user1'
      };
      var element = initDirective($scope);

      attendeeService.getAttendeeCandidates = sinon.stub().returns($q.when([]));

      element.isolateScope().getUsers(query).then(function() {
        expect(attendeeService.getAttendeeCandidates).to.have.been.calledWith(
          query,
          AUTOCOMPLETE_MAX_RESULTS,
          ['user'],
          [{id: session.user.id, objectType: 'user'}]
        );
        done();
      }).catch(done);

      $scope.$digest();
    });

    it('should not pass connected user to #getAttendeeCandidates as excluded object when shouldIncludeSelf option is provided and its value is true', function(done) {
      session.user = {
        id: 'user1'
      };
      var element = initDirective($scope);
      var eleScope = element.isolateScope();

      eleScope.shouldIncludeSelf = true;
      attendeeService.getAttendeeCandidates = sinon.stub().returns($q.when([]));

      element.isolateScope().getUsers(query).then(function() {
        expect(attendeeService.getAttendeeCandidates).to.have.been.calledWith(
          query,
          AUTOCOMPLETE_MAX_RESULTS,
          ['user'],
          []
        );
        done();
      }).catch(done);

      $scope.$digest();
    });

    it('should collect duplicate users based on ID comparing to added users and pass to #getAttendeeCandidates as excluded objects', function(done) {
      var element = initDirective($scope);
      var eleScope = element.isolateScope();

      eleScope.originalUsers = [{
        id: 'user1'
      }];
      eleScope.mutableUsers = [{
        id: 'user2'
      }];

      attendeeService.getAttendeeCandidates = sinon.stub().returns($q.when([]));

      eleScope.getUsers(query).then(function() {
        expect(attendeeService.getAttendeeCandidates).to.have.been.calledWith(
          query,
          AUTOCOMPLETE_MAX_RESULTS,
          ['user'],
          [
            {id: 'user2', objectType: 'user'},
            {id: 'user1', objectType: 'user'}
          ]
        );
        done();
      }).catch(done);

      $scope.$digest();
    });

    it('should collect ignored users and pass to #getAttendeeCandidates as excluded objects', function(done) {
      var element = initDirective($scope);
      var eleScope = element.isolateScope();

      eleScope.ignoredUsers = [{
        id: 'user1',
        preferredEmail: 'user1@open-paas.org'
      }];

      attendeeService.getAttendeeCandidates = sinon.stub().returns($q.when([]));

      eleScope.getUsers(query).then(function() {
        expect(attendeeService.getAttendeeCandidates).to.have.been.calledWith(
          query,
          AUTOCOMPLETE_MAX_RESULTS,
          ['user'],
          [
            {id: 'user1', objectType: 'user'}
          ]
        );
        done();
      }).catch(done);

      $scope.$digest();
    });

    it('should return an empty array if #getAttendeeCandidates return an error', function(done) {
      var element = initDirective($scope);

      attendeeService.getAttendeeCandidates = function() {
        return $q.reject(new Error());
      };

      element.isolateScope().getUsers(query).then(function(result) {
        expect(result).to.have.lengthOf(0);
        done();
      }).catch(done);

      $scope.$digest();
    });
  });
});

