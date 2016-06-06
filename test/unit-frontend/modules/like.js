'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The esn.like Angular module', function() {

  beforeEach(function() {
    module('jadeTemplates');
    module('esn.session');
    module('esn.like');
    module('esn.resource-link');
  });

  describe('The likeButton directive', function() {
    var $compile, $rootScope, $scope, ResourceLinkAPIMock, ResourceLinkAPI, sessionMock, session, LIKE_LINK_TYPE;
    var userId = '1';

    function compileDirective(html) {
      var element = $compile(html)($scope);
      $scope.$digest();
      return element;
    }

    beforeEach(function() {
      ResourceLinkAPIMock = {};
      sessionMock = {
        user: {
          _id: userId
        }
      };
      module(function($provide) {
        $provide.value('ResourceLinkAPI', ResourceLinkAPIMock);
        $provide.value('session', sessionMock);
      });

      inject(function(_$compile_, _$rootScope_, _ResourceLinkAPI_, _LIKE_LINK_TYPE_, _session_) {
        $compile = _$compile_;
        $rootScope = _$rootScope_;
        ResourceLinkAPI = _ResourceLinkAPI_;
        $scope = $rootScope.$new();
        LIKE_LINK_TYPE = _LIKE_LINK_TYPE_;
        session = _session_;
      });
    });

    describe('The like function', function() {

      it('should not send request when resource is already liked', function() {
        var spy = sinon.spy();
        ResourceLinkAPIMock.create = spy;
        $scope.message = {
          _id: '123',
          liked: true
        };
        var element = compileDirective('<like-button target-object-type="esn.message" target-id="message._id" liked="message.liked"/>');
        element.isolateScope().like();
        expect(spy).to.not.have.been.called;
      });

      it('should send request when resource is not liked', function(done) {
        var messageId = '123';

        $scope.message = {
          _id: messageId
        };

        ResourceLinkAPIMock.create = function(source, target, type) {
          expect(source).to.deep.equals({
            objectType: 'user',
            id: session.user._id
          });
          expect(target).to.deep.equals({
            objectType: 'esn.message',
            id: messageId
          });
          expect(type).to.deep.equals(LIKE_LINK_TYPE);
          done();
        };

        var element = compileDirective('<like-button target-object-type="\'esn.message\'" target-id="message._id" liked="message.liked"/>');
        element.isolateScope().like();
      });

      it('should set $scope.liked to true on call success', function() {
        var messageId = '123';

        $scope.message = {
          _id: messageId
        };

        ResourceLinkAPIMock.create = function() {
          return $q.when();
        };

        var element = compileDirective('<like-button target-object-type="\'esn.message\'" target-id="message._id" liked="message.liked"/>');
        element.isolateScope().like();
        $scope.$digest();
        expect(element.isolateScope().liked).to.be.true;
      });

      it('should keep $scope.liked to false on call failure', function() {
        var messageId = '123';

        $scope.message = {
          _id: messageId
        };

        ResourceLinkAPIMock.create = function() {
          return $q.reject(new Error('Fail to update like'));
        };

        var element = compileDirective('<like-button target-object-type="\'esn.message\'" target-id="message._id" liked="message.liked"/>');
        element.isolateScope().like();
        $scope.$digest();
        expect(element.isolateScope().liked).to.not.be.ok;
      });
    });
  });
});
