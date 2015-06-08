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
                { firstname: 'first', lastname: 'last'},
                { emails: ['fist@last'] }
              ],
              domainId: domainId,
              query: query
            };
            onSuccess(response);
          }
        }
      }
    };

    module('jadeTemplates');
    angular.mock.module('esn.calendar');
    angular.mock.module(function($provide) {
      $provide.value('domainAPI', asDomainAPI);
      $provide.value('session', asSession);
    });
  });

  beforeEach(inject(['$compile', '$rootScope', function($c, $r) {
    this.$compile = $c;
    this.$rootScope = $r;
    this.$scope = this.$rootScope.$new();

    this.initDirective = function(scope) {
      var html = '<event-form/>';
      var element = this.$compile(html)(scope);
      scope.$digest();
      return element;
    };
  }]));

  describe('The eventForm directive', function() {

    it('should have a getInvitableAttendees method that call domainApi to build attendees', function(done) {
      this.initDirective(this.$scope);
      this.$scope.getInvitableAttendees('aQuery').then(function(response) {
        expect(response).to.deep.equal({
          data: [
            { firstname: 'first', lastname: 'last', displayName: 'first last'},
            { emails: ['fist@last'], displayName: 'fist@last' }
          ],
          domainId: 'domainId',
          query: { search: 'aQuery', limit: 5 }
        });
        done();
      });
      this.$scope.$digest();
    });

  });
});