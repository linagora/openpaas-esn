'use strict';

angular.module('linagora.esn.contact')
  .factory('ContactDisplayShell', function() {
    var ContactDisplayShell = function(shell) {
      if (shell) {
        this.shell = shell;
        this.writable = true;
        this.overlayIcon = {iconClasses: 'ng-hide'};
        this.informationsToDisplay = [];
        if (this.shell.emails && this.shell.emails.length) {
          this.informationsToDisplay.push({
            objectType: 'email',
            id: this.shell.emails[0].value,
            icon: 'mdi-email-outline',
            action: 'mailto:' + this.shell.emails[0].value
          });
        }
        if (this.shell.tel && this.shell.tel.length) {
          this.informationsToDisplay.push({
            objectType: 'phone',
            id: this.shell.tel[0].value,
            icon: 'mdi-phone',
            action: 'tel:' + this.shell.tel[0].value
          });
        }
        this.dropDownMenuDirective = 'default-menu-items';
      }
    };

    ContactDisplayShell.prototype.isWritable = function() {
      return this.writable;
    };

    ContactDisplayShell.prototype.getDisplayName = function() {
      return this.shell.displayName;
    };

    ContactDisplayShell.prototype.getOverlayIcon = function() {
      return this.overlayIcon;
    };

    ContactDisplayShell.prototype.getInformationsToDisplay = function() {
      return this.informationsToDisplay;
    };

    ContactDisplayShell.prototype.getDropDownMenu = function() {
      return this.dropDownMenuDirective;
    };

    return ContactDisplayShell;
  });
