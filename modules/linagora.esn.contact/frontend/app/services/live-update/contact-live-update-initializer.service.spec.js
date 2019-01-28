'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The ContactLiveUpdateInitializer service', function() {

  var ContactLiveUpdateMock, session, $rootScope;

  beforeEach(function() {
    module('esn.core');
    module('esn.websocket');
    module('esn.api-notification');
    module('linagora.esn.contact');
  });

  beforeEach(function() {
    session = {
      user: {
        _id: 1,
        domains: [
          {
            domain_id: '1234'
          }
        ]
      },
      ready: {
        then: function() {}
      }
    };

    ContactLiveUpdateMock = {
      startListen: function() {},
      stopListen: function() {},
      startListenDomain: function() {}
    };

    module(function($provide) {
      $provide.value('ContactLiveUpdate', ContactLiveUpdateMock);
      $provide.value('session', session);
    });

    inject(function(_$rootScope_) {
      $rootScope = _$rootScope_;
    });
  });

  describe('When started', function() {
    describe('The live update listener', function() {

      it('should be started when the user switch into the contact module', function() {
        ContactLiveUpdateMock.startListen = sinon.spy();
        ContactLiveUpdateMock.stopListen = sinon.spy();
        ContactLiveUpdateMock.startListenDomain = sinon.spy();

        $rootScope.$broadcast('$stateChangeSuccess', {
          name: 'contact.addressbooks'
        });
        expect(ContactLiveUpdateMock.startListen).to.have.been.calledWith(session.user._id);
        expect(ContactLiveUpdateMock.stopListen).to.not.have.been.called;
      });

      it('should be stopped when user switches outside of the contact module', function() {
        ContactLiveUpdateMock.startListen = sinon.spy();
        ContactLiveUpdateMock.stopListen = sinon.spy();
        ContactLiveUpdateMock.startListenDomain = sinon.spy();

        $rootScope.$broadcast('$stateChangeSuccess', {
          name: '/other/module/path'
        });

        expect(ContactLiveUpdateMock.startListen).to.not.have.been.called;
        expect(ContactLiveUpdateMock.stopListen).to.have.been.called;
      });
    });
  });
});
