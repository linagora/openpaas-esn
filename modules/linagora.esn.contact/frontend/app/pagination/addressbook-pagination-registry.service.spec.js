'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The AddressBookPaginationRegistry service', function() {
  var ContactAPIClient, listMock, searchMock;

  beforeEach(function() {
    ContactAPIClient = {
      addressbookHome: function() {
        return {
          search: searchMock,
          addressbook: function() {
            return {
              vcard: function() {
                return {
                  get: function() { return $q.when(); },
                  list: listMock,
                  create: function() { return $q.when(); },
                  update: function() { return $q.when(); },
                  remove: function() { return $q.when(); }
                };
              }
            };
          }
        };
      }
    };
  });

  beforeEach(function() {
    module('linagora.esn.contact', function($provide) {
      $provide.value('ContactAPIClient', ContactAPIClient);
    });
  });

  beforeEach(function() {
    inject(function(AddressBookPaginationRegistry, $rootScope) {
      this.$rootScope = $rootScope;
      this.AddressBookPaginationRegistry = AddressBookPaginationRegistry;
    });
  });

  it('should send back the stored provider', function() {
    var type = 'foo';
    var value = 'bar';
    this.AddressBookPaginationRegistry.put(type, value);
    expect(this.AddressBookPaginationRegistry.get(type)).to.equal(value);
  });
});
