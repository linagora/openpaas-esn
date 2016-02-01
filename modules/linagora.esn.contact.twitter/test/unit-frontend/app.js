'use strict';

/* global chai: false */
var expect = chai.expect;

describe('The contact Twitter module', function() {
  var notificationFactory;

  it('should register the twitter display shell', function(done) {
    var DisplayShellProvider = {
      addDisplayShell: function(displayShell, condition) {
        var shell = {
          addressbook: {
            type: 'twitter'
          }
        };
        expect(condition(shell)).to.equal(true);
        done();
      }
    };
    module('linagora.esn.contact.twitter', function($provide) {
      $provide.value('notificationFactory', notificationFactory);
      $provide.value('DisplayShellProvider', DisplayShellProvider);
    });
    angular.mock.inject(function(TwitterDisplayShell) {
      this.TwitterDisplayShell = TwitterDisplayShell;
    });
  });
});
