'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The contactAddressbookService service', function() {
  var $rootScope, $window;
  var contactAddressbookService, ContactAPIClient, session, contactAddressbookParser, esnUserConfigurationService, ContactVirtualAddressBookService;
  var davProxyPrincipalService;
  var CONTACT_SHARING_INVITE_STATUS;

  beforeEach(function() {
    module('linagora.esn.contact');

    module(function($provide) {
      ContactAPIClient = {};
      session = {
        user: {
          _id: '123'
        },
        ready: {
          then: angular.noop
        }
      };
      davProxyPrincipalService = {
        getGroupMembership: function() {
          return $q.when([]);
        }
      };

      $provide.value('ContactAPIClient', ContactAPIClient);
      $provide.value('session', session);
      $provide.value('davProxyPrincipalService', davProxyPrincipalService);
    });
    inject(function(
      _$rootScope_,
      _$window_,
      _contactAddressbookService_,
      _contactAddressbookParser_,
      _esnUserConfigurationService_,
      _ContactVirtualAddressBookService_,
      _CONTACT_SHARING_INVITE_STATUS_
    ) {
      $rootScope = _$rootScope_;
      $window = _$window_;
      contactAddressbookService = _contactAddressbookService_;
      contactAddressbookParser = _contactAddressbookParser_;
      esnUserConfigurationService = _esnUserConfigurationService_;
      ContactVirtualAddressBookService = _ContactVirtualAddressBookService_;
      CONTACT_SHARING_INVITE_STATUS = _CONTACT_SHARING_INVITE_STATUS_;
    });
  });

  describe('The listAddressbooks function', function() {
    it('should returns virtual addressbook along with dav addressbooks', function(done) {
      var davABs = [{id: 'dav1'}, {id: 'dav2'}];
      var virtualABs = [{id: 'virtual1'}, {id: 'virtual2'}];
      var list = sinon.stub().returns($q.when(davABs));
      var virtualListStub = sinon.stub(ContactVirtualAddressBookService, 'list').returns($q.when(virtualABs));

      ContactAPIClient.addressbookHome = function() {
        return {
          addressbook: function() {
            return {
              list: list
            };
          }
        };
      };
      contactAddressbookService.listAddressbooks().then(function(addressbooks) {
        expect(list).to.have.been.calledOnce;
        expect(virtualListStub).to.have.been.calledOnce;
        expect(addressbooks).to.deep.equal(Array.prototype.concat(davABs, virtualABs));

        done();
      }).catch(done);

      $rootScope.$digest();
    });

    it('should call contactAPIClient to list addressbooks', function() {
      var listSpy = sinon.spy();

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

      contactAddressbookService.listAddressbooks();

      expect(listSpy).to.have.been.calledWith({
        personal: true,
        subscribed: true,
        shared: true,
        contactsCount: true,
        inviteStatus: CONTACT_SHARING_INVITE_STATUS.ACCEPTED
      });
    });

    it('should return address books of groups which the user belongs to', function(done) {
      var listSpy = sinon.spy();
      var groupMemberShip = [
        'group/principal/1',
        'group/principal/2'
      ];

      ContactAPIClient.addressbookHome = sinon.spy(function() {
        return {
          addressbook: function() {
            return {
              list: listSpy
            };
          }
        };
      });

      davProxyPrincipalService.getGroupMembership = sinon.stub().returns($q.when(groupMemberShip));

      contactAddressbookParser.parsePrincipalPath = sinon.spy(function(principal) {
        return { id: principal };
      });

      contactAddressbookService.listAddressbooks()
        .then(function() {
          expect(davProxyPrincipalService.getGroupMembership).to.have.been.calledWith('/principals/users/' + session.user._id);

          expect(contactAddressbookParser.parsePrincipalPath).to.have.been.calledTwice;
          expect(contactAddressbookParser.parsePrincipalPath).to.have.been.calledWith(groupMemberShip[0]);
          expect(contactAddressbookParser.parsePrincipalPath).to.have.been.calledWith(groupMemberShip[1]);

          expect(ContactAPIClient.addressbookHome).to.have.been.calledThrice; // 1 time for list user address books
          expect(ContactAPIClient.addressbookHome).to.have.been.calledWith(session.user._id);
          expect(ContactAPIClient.addressbookHome).to.have.been.calledWith(groupMemberShip[0]);
          expect(ContactAPIClient.addressbookHome).to.have.been.calledWith(groupMemberShip[1]);

          expect(listSpy).to.have.been.calledThrice;
          done();
        });

      $rootScope.$digest();
    });
  });

  describe('The listAggregatedAddressbooks function', function() {
    it('should return addressbooks which are not excluded from aggregation', function(done) {
      var davABs = [{id: 'dav1', excludeFromAggregate: true}, {id: 'dav2'}];
      var virtualABs = [{id: 'virtual1'}, {id: 'virtual2', excludeFromAggregate: true}];
      var list = sinon.stub().returns($q.when(davABs));
      var virtualListStub = sinon.stub(ContactVirtualAddressBookService, 'list').returns($q.when(virtualABs));

      ContactAPIClient.addressbookHome = function() {
        return {
          addressbook: function() {
            return {
              list: list
            };
          }
        };
      };
      contactAddressbookService.listAggregatedAddressbooks().then(function(addressbooks) {
        expect(list).to.have.been.calledOnce;
        expect(virtualListStub).to.have.been.calledOnce;
        expect(addressbooks).to.deep.equal([davABs[1], virtualABs[0]]);

        done();
      }).catch(done);

      $rootScope.$digest();
    });
  });

  describe('The getAddressbookByBookName function', function() {
    it('should return the virtual addressbook if it exists', function(done) {
      var addressbook = {id: 'contacts'};

      ContactAPIClient.addressbookHome = sinon.spy();
      sinon.stub(ContactVirtualAddressBookService, 'get').returns($q.when(addressbook));

      contactAddressbookService.getAddressbookByBookName(addressbook.id).then(function() {
        expect(ContactAPIClient.addressbookHome).to.not.have.been.called;
        expect(ContactVirtualAddressBookService.get).to.have.been.calledWith(addressbook.id);

        done();
      }).catch(done);

      $rootScope.$digest();
    });

    it('should call contactAPIClient to get group addressbook with given bookName', function(done) {
      var bookName = 'bookName';
      var groupId = 'groupId';
      var getSpy = sinon.spy();

      ContactAPIClient.addressbookHome = function(bookId) {
        expect(bookId).to.equal(groupId);

        return {
          addressbook: function(name) {
            expect(name).to.equal(bookName);

            return {
              get: getSpy
            };
          }
        };
      };

      contactAddressbookService.getAddressbookByBookName(bookName, groupId).then(function() {
        expect(getSpy).to.have.been.called;
        done();
      }).catch(done);

      $rootScope.$digest();
    });

    it('should call contactAPIClient to get an addressbook with given bookName', function(done) {
      var getSpy = sinon.spy();

      ContactAPIClient.addressbookHome = function(bookId) {
        expect(bookId).to.equal(session.user._id);

        return {
          addressbook: function(name) {
            expect(name).to.equal('contacts');

            return {
              get: getSpy
            };
          }
        };
      };

      contactAddressbookService.getAddressbookByBookName('contacts').then(function() {
        expect(getSpy).to.have.been.called;

        done();
      }).catch(done);

      $rootScope.$digest();
    });
  });

  describe('The createAddressbook function', function() {
    it('should reject if there is no addressbook', function(done) {
      contactAddressbookService
        .createAddressbook()
        .catch(function(err) {
          expect(err.message).to.equal('Address book is required');
          done();
        });

      $rootScope.$digest();
    });

    it('should reject if there is no addressbook\'s name', function(done) {
      contactAddressbookService
        .createAddressbook({})
        .catch(function(err) {
          expect(err.message).to.equal('Address book\'s name is required');
          done();
        });

      $rootScope.$digest();
    });

    it('should reject if failed to create addressbook', function(done) {
      var addressbook = { name: 'test' };
      var createSpy = sinon.stub().returns($q.reject());

      ContactAPIClient.addressbookHome = function(bookId) {
        expect(bookId).to.equal(session.user._id);

        return {
          addressbook: function() {
            return {
              create: createSpy
            };
          }
        };
      };

      contactAddressbookService
        .createAddressbook(addressbook)
        .catch(function() {
          expect(createSpy).to.have.been.calledWith(addressbook);
          done();
        });

      $rootScope.$digest();
    });

    it('should resolve if success to create addressbook', function(done) {
      var addressbook = { name: 'test' };
      var createSpy = sinon.stub().returns($q.when({}));

      ContactAPIClient.addressbookHome = function(bookId) {
        expect(bookId).to.equal(session.user._id);

        return {
          addressbook: function() {
            return {
              create: createSpy
            };
          }
        };
      };

      contactAddressbookService
        .createAddressbook(addressbook)
        .then(function() {
          expect(createSpy).to.have.been.calledWith(addressbook);
          done();
        })
        .catch(function(err) {
          done(err || 'should resolve');
        });

      $rootScope.$digest();
    });
  });

  describe('The createGroupAddressbook function', function() {
    it('should reject if there is no addressbook', function(done) {
      contactAddressbookService
        .createGroupAddressbook()
        .catch(function(err) {
          expect(err.message).to.equal('Address book is required');
          done();
        });

      $rootScope.$digest();
    });

    it('should reject if there is no addressbook\'s name', function(done) {
      contactAddressbookService
        .createGroupAddressbook({})
        .catch(function(err) {
          expect(err.message).to.equal('Address book\'s name is required');
          done();
        });

      $rootScope.$digest();
    });

    it('should reject if there is no groudId', function(done) {
      contactAddressbookService
        .createGroupAddressbook({ name: 'test' })
        .catch(function(err) {
          expect(err.message).to.equal('groupId is required');
          done();
        });

      $rootScope.$digest();
    });

    it('should reject if failed to create group addressbook', function(done) {
      var addressbook = { name: 'test' };
      var groupId = '123';
      var createSpy = sinon.stub().returns($q.reject());

      ContactAPIClient.addressbookHome = function(bookId) {
        expect(bookId).to.equal(groupId);

        return {
          addressbook: function() {
            return {
              create: createSpy
            };
          }
        };
      };

      contactAddressbookService
        .createGroupAddressbook(addressbook, groupId)
        .catch(function() {
          expect(createSpy).to.have.been.calledWith(addressbook);
          done();
        });

      $rootScope.$digest();
    });

    it('should resolve if success to create group addressbook', function(done) {
      var addressbook = { name: 'test' };
      var groupId = '123';
      var createSpy = sinon.stub().returns($q.when({}));

      ContactAPIClient.addressbookHome = function(bookId) {
        expect(bookId).to.equal(groupId);

        return {
          addressbook: function() {
            return {
              create: createSpy
            };
          }
        };
      };

      contactAddressbookService
        .createGroupAddressbook(addressbook, groupId)
        .then(function() {
          expect(addressbook.type).to.equal('group');
          expect(addressbook.state).to.equal('enabled');
          expect(addressbook.acl).to.deep.equal(['{DAV:}read']);
          expect(createSpy).to.have.been.calledWith(addressbook);
          done();
        })
        .catch(function(err) {
          done(err || 'should resolve');
        });

      $rootScope.$digest();
    });
  });

  describe('The removeAddressbook function', function() {
    it('should reject if removing addressbook failed', function(done) {
      var addressbook = {
        bookName: 'toto'
      };
      var removeSpy = sinon.stub().returns($q.reject());

      ContactAPIClient.addressbookHome = function(bookId) {
        expect(bookId).to.equal(session.user._id);

        return {
          addressbook: function(bookName) {
            expect(bookName).to.equal(addressbook.bookName);

            return {
              remove: removeSpy
            };
          }
        };
      };

      contactAddressbookService
        .removeAddressbook(addressbook)
        .catch(function() {
          expect(removeSpy).to.have.been.called;
          done();
        });

      $rootScope.$digest();
    });

    it('should resolve when successfully removing addressbook', function(done) {
      var addressbook = {
        bookName: 'toto'
      };
      var removeSpy = sinon.stub().returns($q.when());

      ContactAPIClient.addressbookHome = function(bookId) {
        expect(bookId).to.equal(session.user._id);

        return {
          addressbook: function(bookName) {
            expect(bookName).to.equal(addressbook.bookName);

            return {
              remove: removeSpy
            };
          }
        };
      };

      contactAddressbookService
        .removeAddressbook(addressbook)
        .then(function() {
          expect(removeSpy).to.have.been.calledOnce;
          done();
        })
        .catch(done);

      $rootScope.$digest();
    });
  });

  describe('The updateAddressbook function', function() {
    it('should reject if updating addressbook failed', function(done) {
      var addressbook = {
        bookId: '123',
        name: 'toto',
        bookName: 'tata',
        state: 'enabled'
      };
      var updateSpy = sinon.stub().returns($q.reject());

      ContactAPIClient.addressbookHome = function(bookId) {
        expect(bookId).to.equal(addressbook.bookId);

        return {
          addressbook: function(bookName) {
            expect(bookName).to.equal(addressbook.bookName);

            return {
              update: updateSpy
            };
          }
        };
      };

      contactAddressbookService
        .updateAddressbook(addressbook)
        .catch(function() {
          expect(updateSpy).to.have.been.calledWith(addressbook);
          done();
        });

      $rootScope.$digest();
    });

    it('should resolve when successfully updating addressbook', function(done) {
      var addressbook = {
        bookId: '123',
        name: 'toto',
        bookName: 'tata',
        state: 'enabled'
      };
      var updateSpy = sinon.stub().returns($q.when());

      ContactAPIClient.addressbookHome = function(bookId) {
        expect(bookId).to.equal(addressbook.bookId);

        return {
          addressbook: function(bookName) {
            expect(bookName).to.equal(addressbook.bookName);

            return {
              update: updateSpy
            };
          }
        };
      };

      contactAddressbookService
        .updateAddressbook(addressbook)
        .then(function() {
          expect(updateSpy).to.have.been.calledWith(addressbook);
          done();
        })
        .catch(done);

      $rootScope.$digest();
    });
  });

  describe('The listSubscribableAddressbooks function', function() {
    it('should call ContactAPIClient with public param to get subscribable address book list of given bookId', function() {
      var listSpy = sinon.spy();
      var bookId = '123';

      ContactAPIClient.addressbookHome = function(bookId) {
        expect(bookId).to.equal('123');

        return {
          addressbook: function() {
            return {
              list: listSpy
            };
          }
        };
      };
      contactAddressbookService.listSubscribableAddressbooks(bookId);

      expect(listSpy).to.have.been.calledWith({ public: true });
    });
  });

  describe('The listSubscribedAddressbooks function', function() {
    it('should call ContactAPIClient with subscribed param to get subscribed address books of current user', function() {
      var listSpy = sinon.spy();

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
      contactAddressbookService.listSubscribedAddressbooks();

      expect(listSpy).to.have.been.calledWith({ subscribed: true });
    });
  });

  describe('The subscribeAddressbooks function', function() {
    var addressbookSpy;

    beforeEach(function() {
      addressbookSpy = sinon.stub();
      ContactAPIClient.addressbookHome = sinon.stub().returns({
        addressbook: addressbookSpy
      });
    });

    describe('subscribe to public address book', function() {
      it('should call ContactAPIClient with formatted subscription to subscribe to public address books', function() {
        var addressbookShells = [
          {
            description: '',
            name: 'public addressbook1',
            _links: {
              self: {
                href: '/addressbooks/123/456.vcf'
              }
            }
          }
        ];
        var createSpy = sinon.stub().returns($q.when());

        addressbookSpy.returns({
          create: createSpy
        });

        contactAddressbookService.subscribeAddressbooks(addressbookShells);
        $rootScope.$digest();

        expect(ContactAPIClient.addressbookHome).to.have.been.calledWith(session.user._id);
        expect(addressbookSpy).to.have.been.calledWith();
        expect(createSpy).to.have.been.calledWith({
          description: addressbookShells[0].description,
          name: addressbookShells[0].name,
          type: 'subscription',
          'openpaas:source': {
            _links: {
              self: {
                href: addressbookShells[0].href
              }
            }
          }
        });
      });
    });

    describe('subscribe to delegated (shared) address book', function() {
      var CONTACT_SHARING_SUBSCRIPTION_TYPE;

      beforeEach(inject(function(_CONTACT_SHARING_SUBSCRIPTION_TYPE_) {
        CONTACT_SHARING_SUBSCRIPTION_TYPE = _CONTACT_SHARING_SUBSCRIPTION_TYPE_;
      }));

      it('should call ContactAPIClient to accept shared address books', function() {
        var addressbookShells = [
          {
            description: '',
            name: 'public addressbook1',
            bookName: 'bookName',
            bookId: 'bookId',
            subscriptionType: CONTACT_SHARING_SUBSCRIPTION_TYPE.delegation,
            source: {
              name: 'source name'
            }
          }
        ];
        var acceptSpy = sinon.stub().returns($q.when());

        addressbookSpy.returns({
          acceptShare: acceptSpy
        });

        contactAddressbookService.subscribeAddressbooks(addressbookShells);
        $rootScope.$digest();

        expect(ContactAPIClient.addressbookHome).to.have.been.calledWith(addressbookShells[0].bookId);
        expect(addressbookSpy).to.have.been.calledWith(addressbookShells[0].bookName);
        expect(acceptSpy).to.have.been.calledWith({
          displayname: addressbookShells[0].source.name
        });
      });
    });
  });

  describe('The shareAddressbook function', function() {
    it('should call the ContactAPIClient with the addressbook shell containing sharees information', function(done) {
      var addressbookShell = {
        bookID: '123123',
        bookName: 'addressbook1',
        sharees: ['user1', 'user2']
      };

      ContactAPIClient.addressbookHome = function(bookId) {
        expect(bookId).to.equal(addressbookShell.bookdId);

        return {
          addressbook: function(bookName) {
            expect(bookName).to.equal(addressbookShell.bookName);

            return {
              share: function(sharees) {
                expect(sharees).to.deep.equal(addressbookShell.sharees);
                done();

                return $q.when();
              }
            };
          }
        };
      };

      contactAddressbookService.shareAddressbook(addressbookShell, addressbookShell.sharees);
      $rootScope.$digest();
    });
  });

  describe('The updateAddressbookPublicRight function', function() {
    it('should call ContactAPIClient to update public right', function() {
      var updateSpy = sinon.spy();
      var addressbook = {
        bookId: '123',
        bookName: 'foobar'
      };

      ContactAPIClient.addressbookHome = function(bookId) {
        expect(bookId).to.equal(addressbook.bookId);

        return {
          addressbook: function(bookName) {
            expect(bookName).to.equal(addressbook.bookName);

            return {
              updatePublicRight: updateSpy
            };
          }
        };
      };

      contactAddressbookService.updateAddressbookPublicRight(addressbook, 'dav:read');

      expect(updateSpy).to.have.been.calledWith('dav:read');
    });
  });

  describe('The updateGroupAddressbookMembersRight function', function() {
    it('should call ContactAPIClient to update members right', function() {
      var updateSpy = sinon.spy();
      var addressbook = {
        bookId: '123',
        bookName: 'foobar'
      };

      ContactAPIClient.addressbookHome = function(bookId) {
        expect(bookId).to.equal(addressbook.bookId);

        return {
          addressbook: function(bookName) {
            expect(bookName).to.equal(addressbook.bookName);

            return {
              updateMembersRight: updateSpy
            };
          }
        };
      };

      contactAddressbookService.updateGroupAddressbookMembersRight(addressbook, ['{DAV:}read']);

      expect(updateSpy).to.have.been.calledWith(['{DAV:}read']);
    });
  });

  describe('The getAddressbookUrl function', function() {
    var bookId, bookName, addressbook;

    beforeEach(function() {
      addressbook = {};
      bookId = 'bookId';
      bookName = 'bookName';
      contactAddressbookParser.parseAddressbookPath = function() {
        return {
          bookId: bookId,
          bookName: bookName
        };
      };
    });

    it('should return URL with base URL is $window.location.origin when failed to get davserver configuration', function(done) {
      esnUserConfigurationService.get = function() { return $q.reject(); };
      contactAddressbookService.getAddressbookUrl(addressbook).then(function(_url) {
        expect(_url).to.equal($window.location.origin + '/addressbooks/' + bookId + '/' + bookName);
        done();
      }, done);

      $rootScope.$digest();
    });

    it('should return URL with base URL is $window.location.origin when davserver configuration is not configured', function(done) {
      esnUserConfigurationService.get = function() { return $q.when({}); };
      contactAddressbookService.getAddressbookUrl(addressbook).then(function(_url) {
        expect(_url).to.equal($window.location.origin + '/addressbooks/' + bookId + '/' + bookName);
        done();
      }, done);

      $rootScope.$digest();
    });

    it('should return right URL when success to get davserver configuration', function(done) {
      var url = 'http://davserverurl';

      esnUserConfigurationService.get = function() {
        return $q.when([
          {
            name: 'davserver',
            value: {
              frontend: {
                url: url
              }
            }
          }
        ]);
      };
      contactAddressbookService.getAddressbookUrl(addressbook).then(function(_url) {
        expect(_url).to.equal(url + '/addressbooks/' + bookId + '/' + bookName);
        done();
      }, done);

      $rootScope.$digest();
    });
  });
});
