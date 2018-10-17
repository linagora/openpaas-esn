'use strict';

angular.module('linagora.esn.contact.google')
  .factory('GoogleDisplayShell', function(ContactDisplayShell, ContactsHelper, CONTACT_ATTRIBUTES_ORDER, CONTACT_DEFAULT_AVATAR) {

    var GoogleDisplayShell = function(shell) {
      if (shell) {
        this.shell = shell;
        this.overlayIcon = {iconClasses: 'i-contact-google'};
        this.dropDownMenuDirective = 'google-menu-items';
        this.fallbackAvatar = CONTACT_DEFAULT_AVATAR;
        this.informationsToDisplay = [];
        if (this.shell.emails && this.shell.emails.length) {
          var email = ContactsHelper.getOrderedValues(this.shell.emails, CONTACT_ATTRIBUTES_ORDER.email)[0].value;
          this.informationsToDisplay.push({
            objectType: 'email',
            id: email,
            icon: 'mdi-email-outline',
            action: 'mailto:' + email
          });
        }
        if (this.shell.tel && this.shell.tel.length) {
          var tel = ContactsHelper.getOrderedValues(this.shell.tel, CONTACT_ATTRIBUTES_ORDER.phone)[0].value;
          this.informationsToDisplay.push({
            objectType: 'phone',
            id: tel,
            icon: 'mdi-phone',
            action: 'tel:' + tel
          });
        }
        this.addressbook = this.shell.addressbook;
      }
    };

    GoogleDisplayShell.prototype = new ContactDisplayShell();

    return GoogleDisplayShell;
  });
