'use strict';

/* global chai: false */
var expect = chai.expect;

describe('TwitterDisplayShell service', function() {
  var notificationFactory;

  beforeEach(function() {

    module('linagora.esn.contact.twitter', function($provide) {
      $provide.value('notificationFactory', notificationFactory);
    });
  });

  beforeEach(function() {
    angular.mock.inject(function(TwitterDisplayShell) {
      this.TwitterDisplayShell = TwitterDisplayShell;
    });
  });

  function checkTwitterDisplayShell(displayShell, originalShell) {
    var twitterId = originalShell.social[0].value;
    var twitterLink = 'https://twitter.com/' + twitterId;
    var displayName = originalShell.displayName;

    expect(displayShell.getDefaultAvatar()).to.equal('https://abs.twimg.com/sticky/default_profile_images/default_profile_5.png');
    expect(displayShell.getDisplayName()).to.equal(displayName);
    expect(displayShell.isWritable()).to.equal(false);
    expect(displayShell.getOverlayIcon()).to.deep.equal('mdi-twitter twitter-color');

    expect(displayShell.getInformationsToDisplay()).to.deep.equal([
      {
        objectType: 'twitter',
        id: twitterId,
        icon: 'mdi-twitter twitter-color',
        action: twitterLink
      }]);
    expect(displayShell.getDropDownMenu()).to.equal('twitter-menu-items');
  }

  it('should provide twitter contact informations for the template to display', function() {
    var shell = {
      displayName: 'Contact Twitter',
      social: [
        {value: '@linagora'}
      ]
    };

    var displayShell = new this.TwitterDisplayShell(shell);

    checkTwitterDisplayShell(displayShell, shell);
  });

});
