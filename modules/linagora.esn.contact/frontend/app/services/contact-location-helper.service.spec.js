'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The ContactLocationHelper service', function() {
  var bookId = 'bookId';
  var bookName = 'bookName';

  beforeEach(function() {
    module('esn.core');
    module('esn.websocket');
    module('esn.api-notification');
    module('linagora.esn.contact');
  });

  beforeEach(function() {
    var self = this;

    self.$location = { url: angular.noop };
    angular.mock.module(function($provide) {
      $provide.value('$location', self.$location);
    });
  });

  beforeEach(angular.mock.inject(function(ContactLocationHelper) {
    this.ContactLocationHelper = ContactLocationHelper;
  }));

  describe('The contact object', function() {

    describe('The new fn', function() {

      it('should call location.url with correct params', function() {
        this.$location.url = function(url) {
          expect(url).to.equal(['/contact', 'new', bookId, bookName].join('/'));
        };
        this.ContactLocationHelper.contact.new(bookId, bookName);
      });
    });
  });

});
