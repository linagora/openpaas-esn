'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The linagora.esn.contact.import Angular module', function() {
  var ContactImportNotificationServiceMock;

  beforeEach(function() {
    var self = this;

    ContactImportNotificationServiceMock = {
      startListen: sinon.spy()
    };

    angular.mock.module('linagora.esn.contact.import', function($provide) {
      $provide.value('ContactImportNotificationService', ContactImportNotificationServiceMock);
    });

    angular.mock.inject(function($rootScope, session) {
      self.$rootScope = $rootScope;
      self.session = session;
    });
  });

  it('should start listening import notification when session is ready', function() {
    var user = { _id: 123, emails: [] };
    var domain = { _id: 456 };
    this.session.setUser(user);
    this.session.setDomain(domain);
    this.$rootScope.$digest();
    expect(ContactImportNotificationServiceMock.startListen.callCount).to.equal(1);
    expect(ContactImportNotificationServiceMock.startListen.calledWithExactly(user._id)).to.be.true;
  });

});
