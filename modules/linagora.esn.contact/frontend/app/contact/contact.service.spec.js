'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The contactService service', function() {
  var $rootScope, $q;
  var session, contactService, ContactAPIClient, moveFn, davImportServiceMock;

  beforeEach(function() {
    module('esn.session', function($provide) {
      session = {
        user: {
          _id: '123'
        },
        ready: {
          then: angular.noop
        }
      };

      $provide.value('session', session);
    });

    davImportServiceMock = {};

    module('linagora.esn.contact', function($provide) {
      $provide.value('davImportService', davImportServiceMock);
    });

    inject(function(
      _$rootScope_,
      _$q_,
      _contactService_,
      _ContactAPIClient_
    ) {
      $rootScope = _$rootScope_;
      $q = _$q_;
      ContactAPIClient = _ContactAPIClient_;
      contactService = _contactService_;
    });
  });

  describe('The listContacts function', function() {
    it('should call ContactAPIClient with right parameters to get the list of contacts', function(done) {
      var bookId = '1213';
      var bookName = 'contacts';

      ContactAPIClient.addressbookHome = function(currentBookId) {
        return {
          addressbook: function(currentBookName) {

            return {
              get: function() {
                return $q.when({
                  bookId: bookId,
                  bookName: bookName
                });
              },
              vcard: function() {
                return {
                  list: function() {
                    expect(currentBookId).to.equal(bookId);
                    expect(currentBookName).to.equal(bookName);
                    done();
                  }
                };
              }
            };
          }
        };
      };

      contactService.listContacts(bookId, bookName);
      $rootScope.$digest();
    });

    it('should list contact from source address book if the current one is subscription', function(done) {
      var subsBookId = '123';
      var subsBookName = 'contacts';
      var sourceBookId = '456';
      var sourceBookName = 'collected';

      ContactAPIClient.addressbookHome = function(bookId) {
        return {
          addressbook: function(bookName) {

            return {
              get: function() {
                return $q.when({
                  bookId: subsBookId,
                  bookName: subsBookName,
                  source: {
                    bookId: sourceBookId,
                    bookName: sourceBookName
                  },
                  isSubscription: true
                });
              },
              vcard: function() {
                return {
                  list: function() {
                    expect(bookId).to.equal(sourceBookId);
                    expect(bookName).to.equal(sourceBookName);
                    done();
                  }
                };
              }
            };
          }
        };
      };

      contactService.listContacts(subsBookId, subsBookName);
      $rootScope.$digest();
    });
  });

  describe('The getContact function', function() {
    it('should call ContactAPIClient with right parameters to get the contact', function(done) {
      var bookId = '1213';
      var bookName = 'contacts';

      ContactAPIClient.addressbookHome = function(currentBookId) {
        return {
          addressbook: function(currentBookName) {

            return {
              get: function() {
                return $q.when({
                  bookId: bookId,
                  bookName: bookName
                });
              },
              vcard: function() {
                return {
                  get: function() {
                    expect(currentBookId).to.equal(bookId);
                    expect(currentBookName).to.equal(bookName);
                    done();
                  }
                };
              }
            };
          }
        };
      };

      contactService.getContact(bookId, bookName);
      $rootScope.$digest();
    });

    it('should get contact from source address book if the current one is subscription', function(done) {
      var subsBookId = '123';
      var subsBookName = 'contacts';
      var sourceBookId = '456';
      var sourceBookName = 'collected';
      var cardId = 'ghj';

      ContactAPIClient.addressbookHome = function(bookId) {
        return {
          addressbook: function(bookName) {

            return {
              get: function() {
                return $q.when({
                  bookId: subsBookId,
                  bookName: subsBookName,
                  source: {
                    bookId: sourceBookId,
                    bookName: sourceBookName
                  },
                  isSubscription: true
                });
              },
              vcard: function(id) {
                return {
                  get: function() {
                    expect(id).to.equal(cardId);
                    expect(bookId).to.equal(sourceBookId);
                    expect(bookName).to.equal(sourceBookName);
                    done();
                  }
                };
              }
            };
          }
        };
      };

      contactService.getContact({ bookId: sourceBookId, bookName: sourceBookName }, cardId);
      $rootScope.$digest();
    });
  });

  describe('The createContact function', function() {
    it('should call ContactAPIClient with right parameters to create the contact', function(done) {
      var bookId = '1213';
      var bookName = 'contacts';
      var contact = {
        id: '456'
      };

      ContactAPIClient.addressbookHome = function(currentBookId) {
        return {
          addressbook: function(currentBookName) {

            return {
              get: function() {
                return $q.when({
                  bookId: bookId,
                  bookName: bookName
                });
              },
              vcard: function() {
                return {
                  create: function() {
                    expect(currentBookId).to.equal(bookId);
                    expect(currentBookName).to.equal(bookName);
                    done();

                    return $q.when(contact);
                  }
                };
              }
            };
          }
        };
      };

      contactService.createContact({ bookId: bookId, bookName: bookName }, contact);
      $rootScope.$digest();
    });

    it('should create contact in source address book if the current one is subscription', function(done) {
      var subsBookId = '123';
      var subsBookName = 'contacts';
      var sourceBookId = '456';
      var sourceBookName = 'collected';
      var createContact = {
        id: '678'
      };

      ContactAPIClient.addressbookHome = function(bookId) {
        return {
          addressbook: function(bookName) {

            return {
              get: function() {
                return $q.when({
                  bookId: subsBookId,
                  bookName: subsBookName,
                  source: {
                    bookId: sourceBookId,
                    bookName: sourceBookName
                  },
                  isSubscription: true
                });
              },
              vcard: function() {
                return {
                  create: function(contact) {
                    expect(contact).to.deep.equal(createContact);
                    expect(bookId).to.equal(sourceBookId);
                    expect(bookName).to.equal(sourceBookName);
                    done();
                  }
                };
              }
            };
          }
        };
      };

      contactService.createContact({ bookId: subsBookId, bookName: subsBookName }, createContact);
      $rootScope.$digest();
    });
  });

  describe('The updateContact function', function() {
    it('should call ContactAPIClient with right parameters to update the contact', function(done) {
      var addressbook = {
        bookId: '123',
        bookName: 'contacts'
      };
      var contact = {
        id: '456',
        addressbook: addressbook
      };

      ContactAPIClient.addressbookHome = function(currentBookId) {
        return {
          addressbook: function(currentBookName) {

            return {
              get: function() {
                return $q.when(addressbook);
              },
              vcard: function() {
                return {
                  update: function() {
                    expect(currentBookId).to.equal(contact.addressbook.bookId);
                    expect(currentBookName).to.equal(contact.addressbook.bookName);
                    done();

                    return $q.when(contact);
                  }
                };
              }
            };
          }
        };
      };

      contactService.updateContact(addressbook, contact);
      $rootScope.$digest();
    });

    it('should update contact in source address book if the current one is subscription', function(done) {
      var subsBookId = '123';
      var subsBookName = 'contacts';
      var sourceBookId = '456';
      var sourceBookName = 'collected';
      var addressbook = {
        bookId: subsBookId,
        bookName: subsBookName,
        source: {
          bookId: sourceBookId,
          bookName: sourceBookName
        },
        isSubscription: true
      };
      var contact = {
        id: 'jqk',
        addressbook: addressbook
      };

      ContactAPIClient.addressbookHome = function(bookId) {
        return {
          addressbook: function(bookName) {

            return {
              get: function() {
                return $q.when(addressbook);
              },
              vcard: function() {
                return {
                  update: function() {
                    expect(bookId).to.equal(sourceBookId);
                    expect(bookName).to.equal(sourceBookName);
                    done();
                  }
                };
              }
            };
          }
        };
      };

      contactService.updateContact(addressbook, contact);
      $rootScope.$digest();
    });
  });

  describe('The removeContact function', function() {
    it('should call ContactAPIClient with right parameters to remove the contact', function(done) {
      var addressbook = {
        bookId: '123',
        bookName: 'contacts'
      };
      var contact = {
        id: '456',
        addressbook: addressbook
      };

      ContactAPIClient.addressbookHome = function(currentBookId) {
        return {
          addressbook: function(currentBookName) {

            return {
              get: function() {
                return $q.when(addressbook);
              },
              vcard: function() {
                return {
                  remove: function() {
                    expect(currentBookId).to.equal(contact.addressbook.bookId);
                    expect(currentBookName).to.equal(contact.addressbook.bookName);
                    done();
                  }
                };
              }
            };
          }
        };
      };

      contactService.removeContact(addressbook, contact);
      $rootScope.$digest();
    });

    it('should remove contact from source address book if the current one is subscription', function(done) {
      var subsBookId = '123';
      var subsBookName = 'contacts';
      var sourceBookId = '456';
      var sourceBookName = 'collected';
      var addressbook = {
        bookId: subsBookId,
        bookName: subsBookName,
        source: {
          bookId: sourceBookId,
          bookName: sourceBookName
        },
        isSubscription: true
      };
      var contact = {
        id: 'jqk',
        addressbook: addressbook
      };

      ContactAPIClient.addressbookHome = function(bookId) {
        return {
          addressbook: function(bookName) {
            return {
              get: function() {
                return $q.when(addressbook);
              },
              vcard: function() {
                return {
                  remove: function() {
                    expect(bookId).to.equal(sourceBookId);
                    expect(bookName).to.equal(sourceBookName);
                    done();
                  }
                };
              }
            };
          }
        };
      };

      contactService.removeContact(addressbook, contact);
      $rootScope.$digest();
    });
  });

  describe('The copyContact function', function() {
    it('should delete id of the contact before calling ContactAPIClient to copy contact', function(done) {
      var contact = {
        id: '456'
      };
      var addressbook = {
        bookId: session.user._id,
        bookName: 'contacts'
      };

      ContactAPIClient.addressbookHome = function(bookId) {
        expect(bookId).to.equal(session.user._id);

        return {
          addressbook: function(bookName) {
            expect(bookName).to.equal('contacts');

            return {
              get: function() {
                return $q.when(addressbook);
              },
              vcard: function() {
                return {
                  create: function(createContact) {
                    expect(createContact.id).to.be.undefined;
                    done();
                  }
                };
              }
            };
          }
        };
      };

      contactService.copyContact(addressbook, contact);
      $rootScope.$digest();
    });

    it('should copy contact to toAddressbook\'s source AB if the toAddressbook is a subscription', function(done) {
      var toAddressbook = {
        bookId: '123',
        bookName: 'contacts',
        source: {
          bookId: '456',
          bookName: 'collected'
        },
        isSubscription: true
      };

      ContactAPIClient.addressbookHome = function(bookId) {
        return {
          addressbook: function(bookName) {

            return {
              get: function() {
                return $q.when(toAddressbook);
              },
              vcard: function() {
                return {
                  create: function() {
                    expect(bookId).to.equal(toAddressbook.source.bookId);
                    expect(bookName).to.equal(toAddressbook.source.bookName);
                    done();
                  }
                };
              }
            };
          }
        };
      };

      contactService.copyContact(toAddressbook, { id: 'jqk' });
      $rootScope.$digest();
    });
  });

  describe('The moveContact function', function() {
    var contact;

    beforeEach(function() {
      moveFn = sinon.stub().returns($q.when());
      contact = {
        id: 'toto',
        addressbook: {
          bookId: session.user._id,
          bookName: 'contacts'
        }
      };
      ContactAPIClient.addressbookHome = function(bookId) {
        expect(bookId).to.equal(session.user._id);

        return {
          addressbook: function(bookName) {
            expect(bookName).to.equal(contact.addressbook.bookName);

            return {
              vcard: function(cardId) {
                expect(cardId).to.equal(contact.id);

                return {
                  move: moveFn
                };
              }
            };
          }
        };
      };
    });

    it('should move contact to toAddressbook\'s source AB if the toAddressbook is a subscription', function(done) {
      var fromAddressbook = {
        bookId: '456',
        bookName: 'from'
      };

      var toAddressbook = {
        bookId: '456',
        bookName: 'to',
        source: {
          bookId: '789',
          bookName: 'test'
        },
        isSubscription: true
      };

      var contact = {
        id: 'jqk',
        addressbook: fromAddressbook
      };

      ContactAPIClient.addressbookHome = function() {
        return {
          addressbook: function(bookName) {

            return {
              get: function() {
                if (bookName === 'from') {
                  return $q.when(fromAddressbook);
                }

                return $q.when(toAddressbook);
              },
              vcard: function() {
                return {
                  move: function(options) {
                    expect(options).to.deep.equal({
                      toBookId: toAddressbook.source.bookId,
                      toBookName: toAddressbook.source.bookName
                    });
                    done();
                  }
                };
              }
            };
          }
        };
      };

      contactService.moveContact(fromAddressbook, toAddressbook, contact);
      $rootScope.$digest();
    });

    it('should move contact from source of fromAddressbook if the fromAddressbook is a subscription', function(done) {
      var fromAddressbook = {
        bookId: '123',
        bookName: 'from',
        source: {
          bookId: 'jqk',
          bookName: 'test'
        },
        isSubscription: true
      };

      var toAddressbook = {
        bookId: '456',
        bookName: 'to'
      };
      var contact = {
        id: 'jqk',
        addressbook: fromAddressbook
      };

      ContactAPIClient.addressbookHome = function(bookId) {
        return {
          addressbook: function(bookName) {

            return {
              get: function() {
                if (bookName === 'from') {
                  return $q.when(fromAddressbook);
                }

                return $q.when(toAddressbook);
              },
              vcard: function() {
                return {
                  move: function(options) {
                    expect(bookId).to.equal(fromAddressbook.source.bookId);
                    expect(bookName).to.equal(fromAddressbook.source.bookName);
                    expect(options).to.deep.equal({
                      toBookId: toAddressbook.bookId,
                      toBookName: toAddressbook.bookName
                    });
                    done();
                  }
                };
              }
            };
          }
        };
      };

      contactService.moveContact(fromAddressbook, toAddressbook, contact);
      $rootScope.$digest();
    });

    it('should move contact from source of source AB to source of destination AB if both source and destination ABs are subscription', function(done) {
      var fromAddressbook = {
        bookId: '123',
        bookName: 'from',
        source: {
          bookId: 'jqk',
          bookName: 'test'
        },
        isSubscription: true
      };
      var toAddressbook = {
        bookId: '456',
        bookName: 'to',
        source: {
          bookId: '789',
          bookName: 'test1'
        },
        isSubscription: true
      };
      var contact = {
        id: 'jqk',
        addressbook: fromAddressbook
      };

      ContactAPIClient.addressbookHome = function(bookId) {
        return {
          addressbook: function(bookName) {
            return {
              get: function() {
                if (bookName === 'from') {
                  return $q.when(fromAddressbook);
                }

                return $q.when(toAddressbook);
              },
              vcard: function() {
                return {
                  move: function(options) {
                    expect(bookId).to.equal(fromAddressbook.source.bookId);
                    expect(bookName).to.equal(fromAddressbook.source.bookName);
                    expect(options).to.deep.equal({
                      toBookId: toAddressbook.source.bookId,
                      toBookName: toAddressbook.source.bookName
                    });
                    done();
                  }
                };
              }
            };
          }
        };
      };

      contactService.moveContact(fromAddressbook, toAddressbook, contact);
      $rootScope.$digest();
    });
  });

  describe('The importContactsFromFile function', function() {
    it('should call davImportService.importFromFile with right parameters to import contacts', function() {
      var bookId = '1213';
      var bookName = 'contacts';
      var file = [{ type: 'text/vcard', length: 100 }];

      ContactAPIClient.addressbookHome = function() {
        return {
          addressbook: function() {
            return {
              get: function() {
                return $q.when({
                  bookId: bookId,
                  bookName: bookName
                });
              }
            };
          }
        };
      };
      davImportServiceMock.importFromFile = sinon.spy();

      contactService.importContactsFromFile({ bookId: bookId, bookName: bookName }, file[0]);
      $rootScope.$digest();

      expect(davImportServiceMock.importFromFile).to.have.been.calledWith(file[0], '/addressbooks/' + bookId + '/' + bookName + '.json');
    });

    it('should import contacts to source address book if the current one is subscription', function() {
      var subsBookId = '123';
      var subsBookName = 'contacts';
      var sourceBookId = '456';
      var sourceBookName = 'collected';
      var file = [{ type: 'text/vcard', length: 100 }];

      ContactAPIClient.addressbookHome = function() {
        return {
          addressbook: function() {
            return {
              get: function() {
                return $q.when({
                  bookId: subsBookId,
                  bookName: subsBookName,
                  source: {
                    bookId: sourceBookId,
                    bookName: sourceBookName
                  },
                  isSubscription: true
                });
              }
            };
          }
        };
      };
      davImportServiceMock.importFromFile = sinon.spy();

      contactService.importContactsFromFile({ bookId: subsBookId, bookName: subsBookName }, file[0]);
      $rootScope.$digest();

      expect(davImportServiceMock.importFromFile).to.have.been.calledWith(file[0], '/addressbooks/' + sourceBookId + '/' + sourceBookName + '.json');
    });
  });
});
