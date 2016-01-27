'use strict';

/* global chai: false */
var expect = chai.expect;

describe('DisplayShellProvider', function() {
  var notificationFactory;

  beforeEach(function() {

    notificationFactory = {};

    module('linagora.esn.contact', function($provide) {
      $provide.value('notificationFactory', notificationFactory);
    });
  });

  beforeEach(function() {
    angular.mock.inject(function(DisplayShellProvider) {
      this.DisplayShellProvider = DisplayShellProvider;
      this.DisplayShellProvider.resetDisplayShell();
    });
  });

  it('should provide a default display shell for openpaas', function() {
    var displayShellDefault = this.DisplayShellProvider.toDisplayShell({});
    expect(displayShellDefault.getDropDownMenu()).to.equal('default-menu-items');
  });

  it('should provide a correct display shell registered according to its type', function() {
    var displayShellTwitter = function() {
      this.getDropDownMenu = function() {
        return 'twitter-menu-items';
      };
    };
    var displayShellFacebook = function() {
      this.getDropDownMenu = function() {
        return 'facebook-menu-items';
      };
    };

    var fnTwitter = function(shell) {
      if (shell.test === 'Twit') {
        return true;
      }
      return false;
    }, fnFacebook = function(shell) {
      if (shell.test === 'Face') {
        return true;
      }
      return false;
    };

    this.DisplayShellProvider.addDisplayShell(displayShellTwitter, fnTwitter);
    this.DisplayShellProvider.addDisplayShell(displayShellFacebook, fnFacebook);

    var shellTwitter = {
        test: 'Twit'
      },
      shellFacebook = {
        test: 'Face'
      },
      shellAwesome = {
        test: 'TwitFace'
      };

    var displayShellForTestTwitter = this.DisplayShellProvider.toDisplayShell(shellTwitter);
    var displayShellForTestFacebook = this.DisplayShellProvider.toDisplayShell(shellFacebook);
    var displayShellForTestAwesome = this.DisplayShellProvider.toDisplayShell(shellAwesome);

    expect(displayShellForTestTwitter.getDropDownMenu()).to.equal('twitter-menu-items');
    expect(displayShellForTestFacebook.getDropDownMenu()).to.equal('facebook-menu-items');
    expect(displayShellForTestAwesome.getDropDownMenu()).to.equal('default-menu-items');
  });
});
