'use strict';

/* global chai: false */
var expect = chai.expect;

describe('The contact Google module', function() {
  var notificationFactory;

  it('should register the google display shell', function(done) {
    var DisplayShellProvider = {
      addDisplayShell: function(displayShell, condition) {
        var shell = {
          addressbook: {
            type: 'google'
          }
        };
        expect(condition(shell)).to.equal(true);
        done();
      }
    };
    module('linagora.esn.contact.google', function($provide) {
      $provide.value('notificationFactory', notificationFactory);
      $provide.value('DisplayShellProvider', DisplayShellProvider);
    });
    angular.mock.inject(function(GoogleDisplayShell) {
      this.GoogleDisplayShell = GoogleDisplayShell;
    });
  });
});
