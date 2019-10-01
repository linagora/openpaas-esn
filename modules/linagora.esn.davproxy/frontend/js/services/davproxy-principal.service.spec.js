'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The davProxyPrincipalService service', function() {
  var $rootScope, davClient, davProxyPrincipalService;
  var davClientResultMock;

  beforeEach(function() {
    module('linagora.esn.davproxy');

    davClient = sinon.spy(function() {
      return davClientResultMock;
    });

    module(function($provide) {
      $provide.value('davClient', davClient);
    });

    inject(function(
      _$rootScope_,
      _davProxyPrincipalService_
    ) {
      $rootScope = _$rootScope_;
      davProxyPrincipalService = _davProxyPrincipalService_;
    });
  });

  describe('The getGroupMembership method', function() {
    it('should reject if failed to get group member ship', function(done) {
      davClientResultMock = $q.reject();
      var principal = '/users/principal';

      davProxyPrincipalService.getGroupMembership(principal)
        .then(function() {
          done('should not resolve');
        })
        .catch(function() {
          expect(davClient).to.have.been.calledWith('PROPFIND', principal, { Accept: 'application/json' });
          done();
        });

      $rootScope.$digest();
    });

    it('should resolve if success to get group member ship', function(done) {
      var groupMemberShip = ['foo', 'bar'];
      var principal = '/users/principal';

      davClientResultMock = $q.when({
        data: {
          'group-membership': groupMemberShip
        }
      });

      davProxyPrincipalService.getGroupMembership(principal)
        .then(function(_groupMemberShip) {
          expect(_groupMemberShip).to.deep.equal(groupMemberShip);
          expect(davClient).to.have.been.calledWith('PROPFIND', principal, { Accept: 'application/json' });
          done();
        })
        .catch(function(err) {
          done(err || 'should resolve');
        });

      $rootScope.$digest();
    });
  });
});
