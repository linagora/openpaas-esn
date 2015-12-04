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

    expect(displayShell.getDefaultAvatar()).to.equal('/contact.twitter/images/default_twitter_avatar.png');
    expect(displayShell.getDisplayName()).to.equal(displayName);
    expect(displayShell.isWritable()).to.equal(false);
    expect(displayShell.getOverlayIcon()).to.equal('mdi-twitter twitter-color i-contact-twitter');

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

  describe('The getAvatar fn', function() {
    var displayShell, shell, NORMAL_AVATAR, BIGGER_AVATAR;

    beforeEach(function() {
      shell = {
        displayName: 'Contact Twitter',
        social: [
          {value: '@linagora'}
        ],
        photo: 'http://twitter.com/user/avatar.png'
      };
      NORMAL_AVATAR = 'http://twitter.com/user/avatar_normal.png';
      BIGGER_AVATAR = 'http://twitter.com/user/avatar_bigger.png';

      displayShell = new this.TwitterDisplayShell(shell);
    });

    it('should return normal size when input size is less than or equal 50', function() {
      expect(displayShell.getAvatar(49)).to.equal(NORMAL_AVATAR);
      expect(displayShell.getAvatar(50)).to.equal(NORMAL_AVATAR);
      expect(displayShell.getAvatar(51)).to.not.equal(NORMAL_AVATAR);
    });

    it('should return bigger size when input size is between 50 and 100', function() {
      expect(displayShell.getAvatar(51)).to.equal(BIGGER_AVATAR);
      expect(displayShell.getAvatar(96)).to.equal(BIGGER_AVATAR);
      expect(displayShell.getAvatar(100)).to.equal(BIGGER_AVATAR);
    });

    it('should return original size when input size is greater than 100', function() {
      expect(displayShell.getAvatar(101)).to.equal(shell.photo);
      expect(displayShell.getAvatar(256)).to.equal(shell.photo);
    });

  });

});
