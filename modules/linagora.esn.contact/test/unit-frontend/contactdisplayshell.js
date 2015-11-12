'use strict';

/* global chai: false */
var expect = chai.expect;

describe('ContactDisplayShell', function() {
  var notificationFactory;

  beforeEach(function() {

    notificationFactory = {};

    module('linagora.esn.contact', function($provide) {
      $provide.value('notificationFactory', notificationFactory);
    });
  });

  beforeEach(function() {
    angular.mock.inject(function(ContactDisplayShell) {
      this.ContactDisplayShell = ContactDisplayShell;
    });
  });

  function checkContactDisplayShell(displayShell, originalShell) {
    var displayName = originalShell.displayName;

    expect(displayShell.getDisplayName()).to.equal(displayName);
    expect(displayShell.isWritable()).to.equal(true);
    expect(displayShell.getOverlayIcon()).to.deep.equal({iconClasses: 'ng-hide'});
    expect(displayShell.getInformationsToDisplay()).to.deep.equal([
      {
        objectType: 'email',
        id: originalShell.emails[0].value,
        icon: 'mdi-email-outline',
        actions: 'mailto:' + originalShell.emails[0].value
      },
      {
        objectType: 'phone',
        id: originalShell.tel[0].value,
        icon: 'mdi-phone',
        actions: 'tel:' + originalShell.tel[0].value
      }]);
    expect(displayShell.getDropDownMenu()).to.equal('default-menu-items');
  }

  it('should provide contact default contact informations for the template to display', function() {
    var shell = {
      emails: [
        {value: 'perso@linagora.com'}
      ],
      tel: [
        {value: '01.02.03.04.05'}
      ]
    };

    var displayShell = new this.ContactDisplayShell(shell);

    checkContactDisplayShell(displayShell, shell);
  });
});
