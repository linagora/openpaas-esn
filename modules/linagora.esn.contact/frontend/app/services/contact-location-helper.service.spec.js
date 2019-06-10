'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The ContactLocationHelper service', function() {
  var bookId = 'bookId';
  var bookName = 'bookName';
  var $location, ContactLocationHelper;

  beforeEach(function() {
    module('esn.core');
    module('esn.websocket');
    module('esn.api-notification');
    module('linagora.esn.contact');
  });

  beforeEach(function() {
    $location = { url: angular.noop };

    module(function($provide) {
      $provide.value('$location', $location);
    });
  });

  beforeEach(inject(function(_ContactLocationHelper_) {
    ContactLocationHelper = _ContactLocationHelper_;
  }));

  describe('The contact object', function() {

    describe('The new method', function() {
      it('should call $location.url with correct params', function() {
        $location.url = function(url) {
          expect(url).to.equal(['/contact', 'new', bookId, bookName].join('/'));
        };
        ContactLocationHelper.contact.new(bookId, bookName);
      });

      it('should not call $location.replace if param shouldReplaceState is false', function() {
        var replaceMethodMock = false;

        $location.url = function() {
          return {
            replace: function() {
              replaceMethodMock = true;
            }
          };
        };

        ContactLocationHelper.contact.new(bookId, bookName, false);

        expect(replaceMethodMock).to.be.false;
      });

      it('should call $location.replace if param shouldReplaceState is true', function() {
        var replaceMethodMock = false;

        $location.url = function() {
          return {
            replace: function() {
              replaceMethodMock = true;
            }
          };
        };

        ContactLocationHelper.contact.new(bookId, bookName, true);

        expect(replaceMethodMock).to.be.true;
      });
    });
  });
});
