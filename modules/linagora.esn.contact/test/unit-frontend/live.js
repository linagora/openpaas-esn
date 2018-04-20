'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The Contact Live module', function() {

  var bookId = 'A bookId';

  beforeEach(function() {
    module('esn.core');
    module('esn.websocket');
    module('esn.api-notification');
    module('linagora.esn.contact');
  });

  describe('The ContactLiveUpdateInitializer service', function() {

    var ContactLiveUpdateMock, session, $rootScope;

    beforeEach(function() {
      session = {
        user: {_id: 1},
        ready: {
          then: function() {}
        }
      };

      ContactLiveUpdateMock = {
        startListen: function() {},
        stopListen: function() {}
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
          session.user = {_id: 1};
          ContactLiveUpdateMock.startListen = sinon.spy();
          ContactLiveUpdateMock.stopListen = sinon.spy();

          $rootScope.$broadcast('$stateChangeSuccess', {
            name: 'contact.addressbooks'
          });
          expect(ContactLiveUpdateMock.startListen).to.have.been.calledWith(session.user._id);
          expect(ContactLiveUpdateMock.stopListen).to.not.have.been.called;
        });

        it('should be stopped when user switches outside of the contact module', function() {
          ContactLiveUpdateMock.startListen = sinon.spy();
          ContactLiveUpdateMock.stopListen = sinon.spy();

          $rootScope.$broadcast('$stateChangeSuccess', {
            name: '/other/module/path'
          });

          expect(ContactLiveUpdateMock.startListen).to.not.have.been.called;
          expect(ContactLiveUpdateMock.stopListen).to.have.been.called;
        });
      });
    });
  });

  describe('The ContactLiveUpdate service', function() {
    var liveMock, getMock, liveNotificationMock, ContactAPIClientMock, ContactShellBuilderMock, onFn, removeListenerFn, namespace, contactService;
    var $rootScope, ContactLiveUpdate, CONTACT_WS, CONTACT_EVENTS;
    var session;

    beforeEach(function() {
      getMock = function() {};
      session = {
        ready: {
          then: function() {}
        }
      };
      onFn = function() {};
      removeListenerFn = sinon.spy();

      liveNotificationMock = function(room, bookId) {
        if (liveMock) {
          liveMock(room, bookId);
        }

        return {
          on: onFn,
          removeListener: removeListenerFn
        };
      };

      ContactShellBuilderMock = {
        fromWebSocket: function() {
          return $q.when();
        },
        setAddressbookCache: function() {
        }
      };

      ContactAPIClientMock = {
        addressbookHome: function() {
          return {
            addressbook: function() {
              return {
                vcard: function() {
                  return {
                    get: getMock
                  };
                }
              };
            }
          };
        }
      };

      module(function($provide) {
        $provide.value('livenotification', liveNotificationMock);
        $provide.value('ContactShellBuilder', ContactShellBuilderMock);
        $provide.value('ContactAPIClient', ContactAPIClientMock);
        $provide.value('session', session);
      });

      inject(function(_$rootScope_, _ContactLiveUpdate_, _contactService_, _CONTACT_WS_, _CONTACT_EVENTS_) {
        $rootScope = _$rootScope_;
        ContactLiveUpdate = _ContactLiveUpdate_;
        CONTACT_WS = _CONTACT_WS_;
        CONTACT_EVENTS = _CONTACT_EVENTS_;
        namespace = CONTACT_WS.room;
        contactService = _contactService_;
      });
    });

    describe('The startListen fn', function() {

      beforeEach(function() {
        onFn = sinon.spy();
      });

      it('should subscribe CONTACT_WS.room namespace with bookId', function() {
        liveMock = sinon.spy();
        ContactLiveUpdate.startListen(bookId);
        expect(liveMock).to.have.been.called.once;
        expect(liveMock).to.have.been.calledWith(namespace, bookId);
      });

      it('should make sio to listen on CONTACT_WS.events.CREATED event', function() {
        ContactLiveUpdate.startListen(bookId);
        expect(onFn.firstCall.calledWith(CONTACT_WS.events.CREATED)).to.be.true;
      });

      it('should make sio to listen on CONTACT_WS.events.DELETED event', function() {
        ContactLiveUpdate.startListen(bookId);
        expect(onFn.secondCall.calledWith(CONTACT_WS.events.DELETED)).to.be.true;
      });

      it('should make sio to listen on CONTACT_WS.events.UPDATED event', function() {
        ContactLiveUpdate.startListen(bookId);
        expect(onFn.thirdCall.calledWith(CONTACT_WS.events.UPDATED)).to.be.true;
      });

      describe('When listening to events', function() {

        var createFn, updateFn, deleteFn;

        beforeEach(function() {
          onFn = function(event, handler) {
            switch (event) {
              case CONTACT_WS.events.CREATED:
                createFn = handler;
                break;
              case CONTACT_WS.events.UPDATED:
                updateFn = handler;
                break;
              case CONTACT_WS.events.DELETED:
                deleteFn = handler;
                break;
            }
          };
        });

        describe('On CONTACT_WS.events.CREATED event', function() {
          it('should build a shell and broadcast it to the $rootScope', function(done) {
            var data = { id: '1' };
            var shell = {
              id: '2',
              addressbook: {
                bookId: 'bookId',
                bookName: 'bookName'
              }
            };

            $rootScope.$on(CONTACT_EVENTS.CREATED, function(event, data) {
              expect(data).to.deep.equal(shell);
              done();
            });

            ContactShellBuilderMock.fromWebSocket = function() {
              return $q.when(shell);
            };

            ContactLiveUpdate.startListen(bookId);
            createFn(data);

            $rootScope.$apply();
            done(new Error('Should not be called'));
          });

          it('should inject text avatar before broadcasting it', function(done) {
            var data = { id: '1' };
            var shell = {
              id: '2',
              addressbook: {
                bookId: 'bookId',
                bookName: 'bookName'
              }
            };

            $rootScope.$on(CONTACT_EVENTS.CREATED, function(event, data) {
              expect(data.photo).to.exist;
              done();
            });

            ContactShellBuilderMock.fromWebSocket = function() {
              return $q.when(shell);
            };

            ContactLiveUpdate.startListen(bookId);
            createFn(data);

            $rootScope.$apply();
            done(new Error('Should not be called'));
          });

          it('should not broadcast anything to the scope when shell can not be built', function(done) {
            var data = {id: '1'};

            $rootScope.$on(CONTACT_EVENTS.CREATED, function() {
              done(new Error('Should not be called'));
            });

            ContactShellBuilderMock.fromWebSocket = function() {
              return $q.reject(new Error('Fail'));
            };

            ContactLiveUpdate.startListen(bookId);
            createFn(data);

            $rootScope.$apply();
            done();
          });
        });

        describe('On CONTACT_WS.events.DELETED event', function() {
          it('should broadcast the delete contact id in CONTACT_EVENTS.DELETED', function(done) {
            var data = {contactId: '1'};

            $rootScope.$on(CONTACT_EVENTS.DELETED, function(event, _data) {
              expect(_data).to.deep.equal({id: data.contactId});
              done();
            });

            ContactLiveUpdate.startListen(bookId);
            deleteFn(data);

            $rootScope.$apply();
            done(new Error('Should not be called'));
          });
        });

        describe('On CONTACT_WS.events.UPDATED event', function() {

          it('should load the updated contact from API', function(done) {
            var data = {bookId: '1', bookName: '2', contactId: '3'};
            var contact = {id: '3'};

            contactService.getContact = sinon.stub().returns($q.when(contact));

            $rootScope.$on(CONTACT_EVENTS.UPDATED, function(event, _data) {
              expect(_data).to.deep.equal(contact);
              done();
            });

            ContactLiveUpdate.startListen(bookId);
            updateFn(data);

            $rootScope.$apply();
            done(new Error('Should not be called'));
          });

          it('should not broadcast anything when updated contact can not be loaded from API', function(done) {
            var data = {bookId: '1', bookName: '2', contactId: '3'};

            contactService.getContact = sinon.stub().returns($q.reject(new Error('Failed')));

            $rootScope.$on(CONTACT_EVENTS.UPDATED, function() {
              done(new Error('Should not be called'));
            });

            ContactLiveUpdate.startListen(bookId);
            updateFn(data);

            $rootScope.$apply();
            expect(contactService.getContact).to.have.been.called.once;
            done();
          });
        });
      });
    });

    describe('The stopListen fn', function() {

      it('should make sio to remove CONTACT_WS.events.CREATED event listener', function() {
        var bookId = 'some book id';
        ContactLiveUpdate.startListen(bookId);

        ContactLiveUpdate.stopListen();
        expect(removeListenerFn.firstCall.calledWith(CONTACT_WS.events.CREATED)).to.be.true;
      });

      it('should make sio to remove CONTACT_WS.events.DELETED event listener', function() {
        var bookId = 'some book id';
        ContactLiveUpdate.startListen(bookId);

        ContactLiveUpdate.stopListen();
        expect(removeListenerFn.secondCall.calledWith(CONTACT_WS.events.DELETED)).to.be.true;
      });

      it('should make sio to remove CONTACT_WS.events.UPDATED event listener', function() {
        var bookId = 'some book id';
        ContactLiveUpdate.startListen(bookId);

        ContactLiveUpdate.stopListen();
        expect(removeListenerFn.thirdCall.calledWith(CONTACT_WS.events.UPDATED)).to.be.true;
      });
    });
  });
});
