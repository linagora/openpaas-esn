'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The contactAddressbookService service', function() {
  var $rootScope;
  var contactAddressbookService, ContactAPIClient, session;

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

      $provide.value('ContactAPIClient', ContactAPIClient);
      $provide.value('session', session);
    });
    inject(function(
      _$rootScope_,
      _contactAddressbookService_
    ) {
      $rootScope = _$rootScope_;
      contactAddressbookService = _contactAddressbookService_;
    });
  });

  describe('The listAddressbooks function', function() {
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

      expect(listSpy).to.have.been.called;
    });
  });

  describe('The getAddressbookByBookName function', function() {
    it('should call contactAPIClient to get an addressbook with given bookName', function() {
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

      contactAddressbookService.getAddressbookByBookName('contacts');

      expect(getSpy).to.have.been.called;
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

    it('should broadcast event if success to create addressbook', function(done) {
      var addressbook = { name: 'test' };

      $rootScope.$broadcast = sinon.spy();
      ContactAPIClient.addressbookHome = function(bookId) {
        expect(bookId).to.equal(session.user._id);

        return {
          addressbook: function() {
            return {
              create: function() {
                return $q.when({});
              }
            };
          }
        };
      };

      contactAddressbookService
        .createAddressbook(addressbook)
        .then(function() {
          expect($rootScope.$broadcast).to.have.been.calledOnce;
          done();
        })
        .catch(function(err) {
          done(err || 'should resolve');
        });

      $rootScope.$digest();
    });
  });
});
