'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('the ContactSidebarController controller', function() {
  var $rootScope, $controller, session, ContactAPIClient;

  beforeEach(function() {
    module('esn.core');
    module('linagora.esn.contact', function($provide) {
      ContactAPIClient = {};
      session = {
        user: {
          _id: '123'
        },
        ready: {
          then: angular.noop
        }
      };

      $provide.value('ContactAPIClient', ContactAPIClient);
      $provide.value('session', session);
    });

    inject(function(_$controller_, _$rootScope_) {
      $controller = _$controller_;
      $rootScope = _$rootScope_;
    });
  });

  function initController() {
    var $scope = $rootScope.$new();

    return $controller('ContactSidebarController', {$scope: $scope});
  }

  describe('$onInit fn', function() {
    it('should call contactApiClient to get addressbooks list', function() {
      var controller = initController();
      var listSpy = sinon.stub().returns($q.when(['book1', 'book2']));

      ContactAPIClient.addressbookHome = function(bookId) {
        expect(bookId).to.equal(session.user._id);

        return {
          addressbook: function() {
            return {
              list: listSpy
            };
          }
        };
      };

      controller.$onInit();
      $rootScope.$digest();

      expect(listSpy).to.have.been.called;
      expect(controller.addressbooks).to.deep.equal(['book1', 'book2']);
    });
  });
});
