'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The ContactLiveUpdate service', function() {
  var liveMock, getMock, liveNotificationMock, ContactAPIClientMock, ContactShellBuilderMock, onFn, removeListenerFn, namespace, contactService, contactAddressbookService;
  var $rootScope, ContactLiveUpdate, CONTACT_WS, CONTACT_EVENTS, CONTACT_ADDRESSBOOK_EVENTS;
  var session;
  var bookId = 'A bookId';

  beforeEach(function() {
    module('esn.core');
    module('esn.websocket');
    module('esn.api-notification');
    module('linagora.esn.contact');
  });

  beforeEach(function() {
    getMock = function() {};
    session = {
      ready: {
        then: function() {}
      },
      user: {
        _id: '1',
        domains: [
          {
            domain_id: '1234'
          }
        ]
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

    inject(function(
      _$rootScope_,
      _ContactLiveUpdate_,
      _contactService_,
      _contactAddressbookService_,
      _CONTACT_WS_,
      _CONTACT_EVENTS_,
      _CONTACT_ADDRESSBOOK_EVENTS_
    ) {
      $rootScope = _$rootScope_;
      ContactLiveUpdate = _ContactLiveUpdate_;
      CONTACT_WS = _CONTACT_WS_;
      CONTACT_EVENTS = _CONTACT_EVENTS_;
      namespace = CONTACT_WS.room;
      contactService = _contactService_;
      CONTACT_ADDRESSBOOK_EVENTS = _CONTACT_ADDRESSBOOK_EVENTS_;
      contactAddressbookService = _contactAddressbookService_;
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

    it('should make sio to listen on CONTACT_WS.events.ADDRESSBOOK_CREATED event', function() {
      ContactLiveUpdate.startListen(bookId);
      expect(onFn.calledWith(CONTACT_WS.events.ADDRESSBOOK_CREATED)).to.be.true;
    });

    it('should make sio to listen on CONTACT_WS.events.ADDRESSBOOK_DELETED event', function() {
      ContactLiveUpdate.startListen(bookId);
      expect(onFn.calledWith(CONTACT_WS.events.ADDRESSBOOK_DELETED)).to.be.true;
    });

    it('should make sio to listen on CONTACT_WS.events.ADDRESSBOOK_UPDATED event', function() {
      ContactLiveUpdate.startListen(bookId);
      expect(onFn.calledWith(CONTACT_WS.events.ADDRESSBOOK_UPDATED)).to.be.true;
    });

    it('should make sio to listen on CONTACT_WS.events.ADDRESSBOOK_SUBSCRIPTION_DELETED event', function() {
      ContactLiveUpdate.startListen(bookId);
      expect(onFn.calledWith(CONTACT_WS.events.ADDRESSBOOK_SUBSCRIPTION_DELETED)).to.be.true;
    });

    it('should make sio to listen on CONTACT_WS.events.ADDRESSBOOK_SUBSCRIPTION_UPDATED event', function() {
      ContactLiveUpdate.startListen(bookId);
      expect(onFn.calledWith(CONTACT_WS.events.ADDRESSBOOK_SUBSCRIPTION_UPDATED)).to.be.true;
    });

    it('should make sio to listen on CONTACT_WS.events.ADDRESSBOOK_SUBSCRIPTION_CREATED event', function() {
      ContactLiveUpdate.startListen(bookId);
      expect(onFn.calledWith(CONTACT_WS.events.ADDRESSBOOK_SUBSCRIPTION_CREATED)).to.be.true;
    });

    describe('When listening to events', function() {

      var createFn, updateFn, deleteFn, onAddressbookCreateFn, onAddressbookDeleteFn, onAddressbookSubscriptionDeleteFn, onAddressbookUpdateFn, onAddressbookSubscriptionUpdateFn, onAddressbookSubscriptionCreateFn;

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
            case CONTACT_WS.events.ADDRESSBOOK_CREATED:
              onAddressbookCreateFn = handler;
              break;
            case CONTACT_WS.events.ADDRESSBOOK_DELETED:
              onAddressbookDeleteFn = handler;
              break;
            case CONTACT_WS.events.ADDRESSBOOK_UPDATED:
              onAddressbookUpdateFn = handler;
              break;
            case CONTACT_WS.events.ADDRESSBOOK_SUBSCRIPTION_DELETED:
              onAddressbookSubscriptionDeleteFn = handler;
              break;
            case CONTACT_WS.events.ADDRESSBOOK_SUBSCRIPTION_UPDATED:
              onAddressbookSubscriptionUpdateFn = handler;
              break;
            case CONTACT_WS.events.ADDRESSBOOK_SUBSCRIPTION_CREATED:
              onAddressbookSubscriptionCreateFn = handler;
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

      describe('On CONTACT_WS.events.ADDRESSBOOK_CREATED event', function() {
        it('should not broadcast anything when created address book cannot be loaded', function(done) {
          var data = { bookId: '1', bookName: '2' };

          contactAddressbookService.getAddressbookByBookName = sinon.stub().returns($q.reject(new Error('Failed')));

          $rootScope.$on(CONTACT_ADDRESSBOOK_EVENTS.CREATED, function() {
            done(new Error('Should not be called'));
          });

          ContactLiveUpdate.startListen(bookId);
          onAddressbookCreateFn(data);

          $rootScope.$digest();
          expect(contactAddressbookService.getAddressbookByBookName).to.have.been.called.once;
          done();
        });

        it('should broadcast address book info to the $rootScope', function(done) {
          var data = { bookId: '1', bookName: '2' };

          contactAddressbookService.getAddressbookByBookName = sinon.stub().returns($q.when(data));

          $rootScope.$on(CONTACT_ADDRESSBOOK_EVENTS.CREATED, function(event, _data) {
            expect(_data).to.deep.equal(data);
            done();
          });

          ContactLiveUpdate.startListen(bookId);
          onAddressbookCreateFn(data);

          $rootScope.$digest();
          done(new Error('Should not be called'));
        });
      });

      describe('On CONTACT_WS.events.ADDRESSBOOK_DELETED event', function() {
        it('should broadcast address book info to the $rootScope', function(done) {
          var data = { bookId: '1', bookName: '2' };

          $rootScope.$on(CONTACT_ADDRESSBOOK_EVENTS.DELETED, function(event, _data) {
            expect(_data).to.deep.equal(data);
            done();
          });

          ContactLiveUpdate.startListen(bookId);
          onAddressbookDeleteFn(data);

          $rootScope.$digest();
          done(new Error('Should not be called'));
        });
      });

      describe('On CONTACT_WS.events.ADDRESSBOOK_UPDATED event', function() {
        it('should broadcast address book info to the $rootScope', function(done) {
          var data = { bookId: '1', bookName: '2' };

          contactAddressbookService.getAddressbookByBookName = sinon.stub().returns($q.when(data));

          $rootScope.$on(CONTACT_ADDRESSBOOK_EVENTS.UPDATED, function(event, _data) {
            expect(_data).to.deep.equal(data);
            done();
          });

          ContactLiveUpdate.startListen(bookId);
          onAddressbookUpdateFn(data);

          $rootScope.$digest();
          done(new Error('Should not be called'));
        });
      });

      describe('On CONTACT_WS.events.ADDRESSBOOK_SUBSCRIPTION_DELETED event', function() {
        it('should broadcast address book subscription info to the $rootScope', function(done) {
          var data = { bookId: '1', bookName: '2' };

          $rootScope.$on(CONTACT_ADDRESSBOOK_EVENTS.SUBSCRIPTION_DELETED, function(event, _data) {
            expect(_data).to.deep.equal(data);
            done();
          });

          ContactLiveUpdate.startListen(bookId);
          onAddressbookSubscriptionDeleteFn(data);

          $rootScope.$digest();
          done(new Error('Should not be called'));
        });
      });

      describe('On CONTACT_WS.events.ADDRESSBOOK_SUBSCRIPTION_UPDATED event', function() {
        it('should broadcast address book info to the $rootScope', function(done) {
          var data = { bookId: '1', bookName: '2' };

          contactAddressbookService.getAddressbookByBookName = sinon.stub().returns($q.when(data));

          $rootScope.$on(CONTACT_ADDRESSBOOK_EVENTS.UPDATED, function(event, _data) {
            expect(_data).to.deep.equal(data);
            done();
          });

          ContactLiveUpdate.startListen(bookId);
          onAddressbookSubscriptionUpdateFn(data);

          $rootScope.$digest();
          done(new Error('Should not be called'));
        });
      });

      describe('On CONTACT_WS.events.ADDRESSBOOK_SUBSCRIPTION_CREATED event', function() {
        it('should broadcast address book subscription info to the $rootScope', function(done) {
          var data = { bookId: '1', bookName: '2' };

          contactAddressbookService.getAddressbookByBookName = sinon.stub().returns($q.when(data));

          $rootScope.$on(CONTACT_ADDRESSBOOK_EVENTS.CREATED, function(event, _data) {
            expect(_data).to.deep.equal(data);
            done();
          });

          ContactLiveUpdate.startListen(bookId);
          onAddressbookSubscriptionCreateFn(data);

          $rootScope.$digest();
          done(new Error('Should broadcast the address book subscription'));
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

    it('should make sio to remove CONTACT_WS.events.ADDRESSBOOK_CREATED event listener', function() {
      ContactLiveUpdate.startListen('bookId');

      ContactLiveUpdate.stopListen();
      expect(removeListenerFn.calledWith(CONTACT_WS.events.ADDRESSBOOK_CREATED)).to.be.true;
    });

    it('should make sio to remove CONTACT_WS.events.ADDRESSBOOK_DELETED event listener', function() {
      ContactLiveUpdate.startListen('bookId');

      ContactLiveUpdate.stopListen();
      expect(removeListenerFn.calledWith(CONTACT_WS.events.ADDRESSBOOK_DELETED)).to.be.true;
    });

    it('should make sio to remove CONTACT_WS.events.ADDRESSBOOK_UPDATED event listener', function() {
      ContactLiveUpdate.startListen('bookId');

      ContactLiveUpdate.stopListen();
      expect(removeListenerFn.calledWith(CONTACT_WS.events.ADDRESSBOOK_UPDATED)).to.be.true;
    });

    it('should make sio to remove CONTACT_WS.events.ADDRESSBOOK_SUBSCRIPTION_DELETED event listener', function() {
      ContactLiveUpdate.startListen('bookId');

      ContactLiveUpdate.stopListen();
      expect(removeListenerFn.calledWith(CONTACT_WS.events.ADDRESSBOOK_SUBSCRIPTION_DELETED)).to.be.true;
    });

    it('should make sio to remove CONTACT_WS.events.ADDRESSBOOK_SUBSCRIPTION_UPDATED event listener', function() {
      ContactLiveUpdate.startListen('bookId');

      ContactLiveUpdate.stopListen();
      expect(removeListenerFn.calledWith(CONTACT_WS.events.ADDRESSBOOK_SUBSCRIPTION_UPDATED)).to.be.true;
    });

    it('should make sio to remove CONTACT_WS.events.ADDRESSBOOK_SUBSCRIPTION_CREATED event listener', function() {
      ContactLiveUpdate.startListen('bookId');

      ContactLiveUpdate.stopListen();
      expect(removeListenerFn.calledWith(CONTACT_WS.events.ADDRESSBOOK_SUBSCRIPTION_CREATED)).to.be.true;
    });
  });
});
