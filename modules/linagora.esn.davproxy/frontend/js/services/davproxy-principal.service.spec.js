'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The davproxyPrincipalService service', function() {
  var $rootScope, davClient, davproxyPrincipalService;
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
      _davproxyPrincipalService_
    ) {
      $rootScope = _$rootScope_;
      davproxyPrincipalService = _davproxyPrincipalService_;
    });
  });

  describe('The getGroupMemberShip method', function() {
    it('should reject if failed to get group member ship', function(done) {
      davClientResultMock = $q.reject();
      var principal = '/users/principal';

      davproxyPrincipalService.getGroupMemberShip(principal)
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

      davproxyPrincipalService.getGroupMemberShip(principal)
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
