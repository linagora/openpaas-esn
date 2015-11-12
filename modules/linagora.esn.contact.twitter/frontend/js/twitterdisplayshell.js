'use strict';

angular.module('linagora.esn.contact.twitter')
  .factory('TwitterDisplayShell', function(ContactDisplayShell) {

    var TwitterDisplayShell = function(shell) {
      if (shell) {
        this.shell = shell;
        this.writable = false;
        this.overlayIcon = {iconClasses: 'mdi-twitter twitter-color'};
        this.dropDownMenuDirective = 'twitter-menu-items';

        this.informationsToDisplay = [];
        if (this.shell.social && this.shell.social.length) {
          this.informationsToDisplay.push({
            objectType: 'twitter',
            id: this.shell.social[0].value,
            icon: 'mdi-twitter twitter-color',
            action: 'https://twitter.com/' + this.shell.displayName
          });
        }
      }
    };

    TwitterDisplayShell.prototype = new ContactDisplayShell();

    return TwitterDisplayShell;
  });
