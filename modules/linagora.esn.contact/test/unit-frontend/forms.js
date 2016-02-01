'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The Contacts forms module', function() {

  beforeEach(function() {
    module('linagora.esn.contact');
  });

  describe('The closeContactForm service', function() {

    beforeEach(function() {
      var self = this;
      self.location = {};

      angular.mock.module(function($provide) {
        $provide.value('$location', self.location);
      });
    });

    beforeEach(angular.mock.inject(function(closeContactForm) {
      this.closeContactForm = closeContactForm;
    }));

    it('should change path to /contact', function() {
      this.location.path = sinon.spy();
      this.closeContactForm();
      expect(this.location.path).to.have.been.calledWith(('/contact'));
    });
  });

  describe('The openContactForm service', function() {

    var id, contact;

    beforeEach(function() {
      id = '123';
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

    beforeEach(angular.mock.inject(function(openContactForm) {
      this.openContactForm = openContactForm;
    }));

    it('should save the contact in the sharedContactDataService when defined', function() {
      this.openContactForm(id, contact);
      expect(this.sharedContactDataService.contact).to.deep.equal(contact);
    });

    it('should call the ContactLocationHelper.contact.new with right parameter', function() {
      this.ContactLocationHelper.contact.new = sinon.spy();
      this.openContactForm(id, contact);
      expect(this.ContactLocationHelper.contact.new).to.have.been.calledWith(id);
    });
  });
});
