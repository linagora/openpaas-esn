'use strict';

angular.module('linagora.esn.contact.twitter')
  .factory('TwitterDisplayShell', function(ContactDisplayShell, TWITTER_DEFAULT_AVATAR) {

    var TwitterDisplayShell = function(shell) {
      if (shell) {
        this.shell = shell;
        this.overlayIcon = {iconClasses: 'mdi-twitter twitter-color i-contact-twitter'};
        this.dropDownMenuDirective = 'twitter-menu-items';
        this.fallbackAvatar = TWITTER_DEFAULT_AVATAR;

        this.informationsToDisplay = [];
        if (this.shell.social && this.shell.social.length) {
          this.informationsToDisplay.push({
            objectType: 'twitter',
            id: this.shell.social[0].value,
            icon: 'mdi-twitter twitter-color',
            action: 'https://twitter.com/' + this.shell.social[0].value
          });
        }
        this.addressbook = this.shell.addressbook;
      }
    };

    TwitterDisplayShell.prototype = new ContactDisplayShell();

    /**
     * Return approximate Twitter profile picture based on input size:
     * https://dev.twitter.com/overview/general/user-profile-images-and-banners
     * Note that Twitter contact always has avatar and it is in original size.
     * @param  {Number} size input avatar size
     * @return {String}      URL of approximate profile picture
     */
    TwitterDisplayShell.prototype.getAvatar = function(size) {
      var replaceStr = null;
      if (size <= 50) {
        replaceStr = '_normal.$1';
      } else if (size <= 100) {
        replaceStr = '_bigger.$1';
      }
      if (replaceStr) {
        return this.shell.photo.replace(/\.(png|jpg|jpeg)$/, replaceStr);
      }
      return this.shell.photo;
    };

    return TwitterDisplayShell;
  });
