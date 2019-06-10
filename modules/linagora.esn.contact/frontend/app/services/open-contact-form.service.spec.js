'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The openContactForm service', function() {

  var bookId, bookName, contact;

  beforeEach(function() {
    module('linagora.esn.contact');
  });

  beforeEach(function() {
    bookId = '123';
    bookName = 'contacts';
    contact = {_id: '456'};
    var self = this;

    self.sharedContactDataService = {};
    self.ContactLocationHelper = {
      contact: {
        new: function() {}
      }
    };

    angular.mock.module(function($provide) {
      $provide.value('sharedContactDataService', self.sharedContactDataService);
      $provide.value('ContactLocationHelper', self.ContactLocationHelper);
    });
  });

  beforeEach(angular.mock.inject(function(openContactForm, DEFAULT_ADDRESSBOOK_NAME) {
    this.openContactForm = openContactForm;
    this.DEFAULT_ADDRESSBOOK_NAME = DEFAULT_ADDRESSBOOK_NAME;
  }));

  it('should save the contact in the sharedContactDataService when defined', function() {
    this.openContactForm({
      bookId: bookId,
      bookName: bookName,
      contact: contact
    });
    expect(this.sharedContactDataService.contact).to.deep.equal(contact);
  });

  it('should call the ContactLocationHelper.contact.new with right parameter if there is no shouldReplaceState param is given', function() {
    this.ContactLocationHelper.contact.new = sinon.spy();
    this.openContactForm({
      bookId: bookId,
      bookName: bookName,
      contact: contact
    });
    expect(this.ContactLocationHelper.contact.new).to.have.been.calledWithExactly(bookId, bookName, undefined);
  });

  it('should call the ContactLocationHelper.contact.new with right parameter', function() {
    this.ContactLocationHelper.contact.new = sinon.spy();
    this.openContactForm({
      bookId: bookId,
      bookName: bookName,
      contact: contact,
      shouldReplaceState: true
    });
    expect(this.ContactLocationHelper.contact.new).to.have.been.calledWithExactly(bookId, bookName, true);
  });
});
