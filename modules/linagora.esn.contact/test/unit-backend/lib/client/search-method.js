const expect = require('chai').expect;
const mockery = require('mockery');
const sinon = require('sinon');

const { SHARING_INVITE_STATUS } = require('../../../../backend/lib/constants');

describe('The contact client module #searchContacts method', function() {
  const CLIENT_OPTIONS = { davserver: 'davServerUrl', ESNToken: 'token' };
  const user = { _id: 'userid ' };
  let addressbookHomeMock, deps;

  beforeEach(function() {
    deps = {
      logger: {
        error: function() {},
        debug: function() {},
        info: function() {},
        warning: function() {}
      },
      davserver: {}
    };

    mockery.registerMock('./listener', function() {});
  });

  const dependencies = function(name) {
    return deps[name];
  };

  function getModule() {
    return require('../../../../backend/lib/client')(dependencies);
  }

  describe('When addressbooks are provided', function() {
    const addressbook = {
      bookId: user._id,
      bookName: 'contact'
    };
    const options = {
      addressbooks: [{ bookHome: user._id }],
      user,
      search: 'term',
      limit: 20,
      page: 1
    };
    let listAddressbooksResponse = {
      body: {
        _embedded: {
          'dav:addressbook': [{
            _links: {
              self: {
                href: `/addressbooks/${addressbook.bookId}/${addressbook.bookName}.json`
              }
            }
          }]
        }
      }
    };

    it('should reject if failed to search contacts', function(done) {
      addressbookHomeMock = sinon.spy(function() {
        return {
          addressbook: function() {
            return {
              list: () => Promise.resolve(listAddressbooksResponse)
            };
          }
        };
      });
      mockery.registerMock('./addressbookHome', () => addressbookHomeMock);

      const searchContactsMock = sinon.spy(function(searchOptions, callback) {
        return callback(new Error('something wrong'));
      });

      mockery.registerMock('../search', () => ({
        searchContacts: searchContactsMock
      }));

      getModule()(CLIENT_OPTIONS).searchContacts(options)
        .then(() => done(new Error('should not resolve')))
        .catch(err => {
          expect(searchContactsMock).to.have.been.calledWith({
            search: options.search,
            limit: options.limit,
            page: options.page,
            addressbooks: [{ bookHome: addressbook.bookId, bookName: addressbook.bookName }],
            excludeIds: options.excludeIds
          });
          expect(err.message).to.equal('something wrong');
          done();
        });
    });

    it('should resolve if success to search contacts', function(done) {
      const contact = {
        _source: {
          bookId: addressbook.bookId,
          bookName: addressbook.bookName,
          contactId: 'contactId'
        },
        _id: 'contactId'
      };

      addressbookHomeMock = sinon.spy(function() {
        return {
          addressbook: function() {
            return {
              list: () => Promise.resolve(listAddressbooksResponse)
            };
          }
        };
      });
      mockery.registerMock('./addressbookHome', () => addressbookHomeMock);

      const searchContactsMock = function(searchOptions, callback) {
        expect(searchOptions).to.deep.equal({
          search: options.search,
          limit: options.limit,
          page: options.page,
          addressbooks: [{ bookHome: addressbook.bookId, bookName: addressbook.bookName }],
          excludeIds: options.excludeIds
        });

        return callback(null, {
          total_count: 1,
          current_page: 1,
          list: [contact]
        });
      };

      mockery.registerMock('../search', () => ({
        searchContacts: searchContactsMock
      }));

      getModule()(CLIENT_OPTIONS).searchContacts(options)
        .then(output => {
          expect(output).to.deep.equal({
            total_count: 1,
            current_page: 1,
            results: [{
              bookId: addressbook.bookId,
              bookName: addressbook.bookName,
              contactId: contact._id
            }]
          });
          done();
        })
        .catch(err => done(err || new Error('should resolve')));
    });

    it('should resolve if success to search contacts if there is a subscription address book', function(done) {
      const sourceAddressbook = {
        bookId: 'sourceId',
        bookName: 'sourceName'
      };

      listAddressbooksResponse = {
        body: {
          _embedded: {
            'dav:addressbook': [{
              _links: {
                self: {
                  href: `/addressbooks/${addressbook.bookId}/${addressbook.bookName}.json`
                }
              },
              'openpaas:source': `/addressbooks/${sourceAddressbook.bookId}/${sourceAddressbook.bookName}.json`
            }]
          }
        }
      };

      const listAddressBooksMock = () => Promise.resolve(listAddressbooksResponse);
      const contact = {
        _source: {
          bookId: sourceAddressbook.bookId,
          bookName: sourceAddressbook.bookName,
          contactId: 'contactId'
        },
        _id: 'contactId'
      };

      addressbookHomeMock = sinon.spy(function() {
        return {
          addressbook: function() {
            return {
              list: listAddressBooksMock
            };
          }
        };
      });
      mockery.registerMock('./addressbookHome', () => addressbookHomeMock);

      const searchContactsMock = function(searchOptions, callback) {
        expect(searchOptions).to.deep.equal({
          search: options.search,
          limit: options.limit,
          page: options.page,
          addressbooks: [{ bookHome: sourceAddressbook.bookId, bookName: sourceAddressbook.bookName }],
          excludeIds: options.excludeIds
        });

        return callback(null, {
          total_count: 1,
          current_page: 1,
          list: [contact]
        });
      };

      mockery.registerMock('../search', () => ({
        searchContacts: searchContactsMock
      }));

      getModule()(CLIENT_OPTIONS).searchContacts(options)
        .then(output => {
          expect(output).to.deep.equal({
            total_count: 1,
            current_page: 1,
            results: [{
              bookId: sourceAddressbook.bookId,
              bookName: sourceAddressbook.bookName,
              contactId: contact._id,
              'openpaas:addressbook': {
                bookHome: addressbook.bookId,
                bookName: addressbook.bookName
              }
            }]
          });
          done();
        })
        .catch(err => done(err || new Error('should resolve')));
    });
  });

  describe('When addressbooks are not provided', function() {
    const groupAddressbook = {
      bookId: 'groupBookId',
      bookName: 'groupBookName'
    };
    const options = {
      user,
      search: 'term',
      limit: 20,
      page: 1
    };
    const addressbook = {
      bookId: user._id,
      bookName: 'contact'
    };
    let listAddressbooksResponse = {
      body: {
        _embedded: {
          'dav:addressbook': [{
            _links: {
              self: {
                href: `/addressbooks/${addressbook.bookId}/${addressbook.bookName}.json`
              }
            }
          }]
        }
      }
    };
    const listGroupAddressbooksResponse = {
      body: {
        _embedded: {
          'dav:addressbook': [{
            _links: {
              self: {
                href: `/addressbooks/${groupAddressbook.bookId}/${groupAddressbook.bookName}.json`
              }
            }
          }]
        }
      }
    };
    let groupAddressbookHomesMock;

    beforeEach(function() {
      groupAddressbookHomesMock = {
        getGroupAddressbookHomes: () => Promise.resolve([groupAddressbook.bookId])
      };

      mockery.registerMock('./group-addressbook-home', () => groupAddressbookHomesMock);
    });

    it('should reject if failed to get group address book homes', function(done) {
      groupAddressbookHomesMock.getGroupAddressbookHomes = sinon.stub().returns(Promise.reject(new Error('something wrong')));

      getModule()(CLIENT_OPTIONS).searchContacts(options)
        .then(() => done(new Error('should not resolve')))
        .catch(err => {
          expect(groupAddressbookHomesMock.getGroupAddressbookHomes).to.have.been.calledWith(user, {
            davServerUrl: CLIENT_OPTIONS.davserver,
            ESNToken: CLIENT_OPTIONS.ESNToken
          });
          expect(err.message).to.equal('something wrong');
          done();
        });
    });

    it('should reject if failed to list searchable address books', function(done) {
      const listAddressBooksMock = sinon.stub().returns(Promise.reject(new Error('something wrong')));

      addressbookHomeMock = sinon.spy(function() {
        return {
          addressbook: function() {
            return {
              list: listAddressBooksMock
            };
          }
        };
      });
      mockery.registerMock('./addressbookHome', () => addressbookHomeMock);

      getModule()(CLIENT_OPTIONS).searchContacts(options)
        .then(() => done(new Error('should not resolve')))
        .catch(err => {
          expect(addressbookHomeMock).to.have.been.calledTwice;
          expect(addressbookHomeMock).to.have.been.calledWith(user._id);
          expect(addressbookHomeMock).to.have.been.calledWith(groupAddressbook.bookId);
          expect(listAddressBooksMock).to.have.been.calledTwice;
          expect(listAddressBooksMock).to.have.been.calledWith({
            query: {
              personal: true,
              subscribed: true,
              shared: true,
              inviteStatus: SHARING_INVITE_STATUS.ACCEPTED
            }
          });
          expect(err.message).to.equal('something wrong');
          done();
        });
    });

    it('should reject if failed to search contacts', function(done) {
      addressbookHomeMock = function(bookHome) {
        return {
          addressbook: function() {
            return {
              list: () => {
                if (bookHome === addressbook.bookId) {
                  return Promise.resolve(listAddressbooksResponse);
                }

                return Promise.resolve(listGroupAddressbooksResponse);
              }
            };
          }
        };
      };
      mockery.registerMock('./addressbookHome', () => addressbookHomeMock);

      const searchContactsMock = sinon.spy(function(searchOptions, callback) {
        return callback(new Error('something wrong'));
      });

      mockery.registerMock('../search', () => ({
        searchContacts: searchContactsMock
      }));

      getModule()(CLIENT_OPTIONS).searchContacts(options)
        .then(() => done(new Error('should not resolve')))
        .catch(err => {
          expect(searchContactsMock).to.have.been.calledWith({
            search: options.search,
            limit: options.limit,
            page: options.page,
            addressbooks: [
              { bookHome: addressbook.bookId, bookName: addressbook.bookName },
              { bookHome: groupAddressbook.bookId, bookName: groupAddressbook.bookName }
            ],
            excludeIds: options.excludeIds
          });
          expect(err.message).to.equal('something wrong');
          done();
        });
    });

    it('should resolve if success to search contacts', function(done) {
      const contact = {
        _source: {
          bookId: addressbook.bookId,
          bookName: addressbook.bookName,
          contactId: 'contactId'
        },
        _id: 'contactId'
      };

      addressbookHomeMock = function(bookHome) {
        return {
          addressbook: function() {
            return {
              list: () => {
                if (bookHome === addressbook.bookId) {
                  return Promise.resolve(listAddressbooksResponse);
                }

                return Promise.resolve(listGroupAddressbooksResponse);
              }
            };
          }
        };
      };
      mockery.registerMock('./addressbookHome', () => addressbookHomeMock);

      const searchContactsMock = function(searchOptions, callback) {
        expect(searchOptions).to.deep.equal({
          search: options.search,
          limit: options.limit,
          page: options.page,
          addressbooks: [
            { bookHome: addressbook.bookId, bookName: addressbook.bookName },
            { bookHome: groupAddressbook.bookId, bookName: groupAddressbook.bookName }
          ],
          excludeIds: options.excludeIds
        });

        return callback(null, {
          total_count: 1,
          current_page: 1,
          list: [contact]
        });
      };

      mockery.registerMock('../search', () => ({
        searchContacts: searchContactsMock
      }));

      getModule()(CLIENT_OPTIONS).searchContacts(options)
        .then(output => {
          expect(output).to.deep.equal({
            total_count: 1,
            current_page: 1,
            results: [{
              bookId: addressbook.bookId,
              bookName: addressbook.bookName,
              contactId: contact._id
            }]
          });
          done();
        })
        .catch(err => done(err || new Error('should resolve')));
    });

    it('should resolve if success to search contacts if there is a subscription address book', function(done) {
      const sourceAddressbook = {
        bookId: 'sourceId',
        bookName: 'sourceName'
      };

      listAddressbooksResponse = {
        body: {
          _embedded: {
            'dav:addressbook': [{
              _links: {
                self: {
                  href: `/addressbooks/${addressbook.bookId}/${addressbook.bookName}.json`
                }
              },
              'openpaas:source': `/addressbooks/${sourceAddressbook.bookId}/${sourceAddressbook.bookName}.json`
            }]
          }
        }
      };

      const contact = {
        _source: {
          bookId: sourceAddressbook.bookId,
          bookName: sourceAddressbook.bookName,
          contactId: 'contactId'
        },
        _id: 'contactId'
      };

      addressbookHomeMock = function(bookHome) {
        return {
          addressbook: function() {
            return {
              list: () => {
                if (bookHome === addressbook.bookId) {
                  return Promise.resolve(listAddressbooksResponse);
                }

                return Promise.resolve(listGroupAddressbooksResponse);
              }
            };
          }
        };
      };
      mockery.registerMock('./addressbookHome', () => addressbookHomeMock);

      const searchContactsMock = function(searchOptions, callback) {
        expect(searchOptions).to.deep.equal({
          search: options.search,
          limit: options.limit,
          page: options.page,
          addressbooks: [
            { bookHome: sourceAddressbook.bookId, bookName: sourceAddressbook.bookName },
            { bookHome: groupAddressbook.bookId, bookName: groupAddressbook.bookName }
          ],
          excludeIds: options.excludeIds
        });

        return callback(null, {
          total_count: 1,
          current_page: 1,
          list: [contact]
        });
      };

      mockery.registerMock('../search', () => ({
        searchContacts: searchContactsMock
      }));

      getModule()(CLIENT_OPTIONS).searchContacts(options)
        .then(output => {
          expect(output).to.deep.equal({
            total_count: 1,
            current_page: 1,
            results: [{
              bookId: sourceAddressbook.bookId,
              bookName: sourceAddressbook.bookName,
              contactId: contact._id,
              'openpaas:addressbook': {
                bookHome: addressbook.bookId,
                bookName: addressbook.bookName
              }
            }]
          });
          done();
        })
        .catch(err => done(err || new Error('should resolve')));
    });
  });
});
