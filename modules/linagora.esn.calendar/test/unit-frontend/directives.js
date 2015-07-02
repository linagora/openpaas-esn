'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The Calendar Angular module', function() {

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
                { firstname: 'first', lastname: 'last', emails: ['user1@test.com'] },
                { emails: ['fist@last'] },
                { firstname: 'john', lastname: 'doe', emails: ['johndoe@test.com'] }
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

  beforeEach(inject(['$compile', '$rootScope', 'moment', 'calendarUtils', function($c, $r, moment, calendarUtils) {
    this.$compile = $c;
    this.$rootScope = $r;
    this.$scope = this.$rootScope.$new();
    this.moment = moment;
    this.calendarUtils = calendarUtils;

    this.initDirective = function(scope) {
      var html = '<event-form/>';
      var element = this.$compile(html)(scope);
      scope.$digest();
      return element;
    };
  }]));

  describe('The eventForm directive', function() {

    it('should initiate $scope.editedEvent from $scope.event if it exists', function() {
      this.$scope.event = {
        _id: '123456',
        allDay: true,
        attendees: [{'displayName': 'user1@openpaas.org'}]
      };
      this.initDirective(this.$scope);
      expect(this.$scope.editedEvent).to.deep.equal(this.$scope.event);
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
          { emails: ['fist@last'], displayName: 'fist@last', email: 'fist@last' },
          { firstname: 'john', lastname: 'doe', 'emails': ['johndoe@test.com'], displayName: 'john doe', email: 'johndoe@test.com'}
        ]);
        done();
      });
      this.$scope.$digest();
    });

  });
});
