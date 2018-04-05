'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The Contacts service module', function() {
  var bookId = 'bookId';
  var bookName = 'bookName';

  beforeEach(function() {
    module('esn.core');
    module('esn.websocket');
    module('esn.api-notification');
    module('linagora.esn.contact');
  });

  describe('The deleteContact service', function() {

    var CONTACT_EVENTS, contact;

    beforeEach(function() {
      var self = this;
      this.notificationFactory = {};
      this.gracePeriodService = {};

      contact = { id: '00000000-0000-4000-a000-000000000000', lastName: 'Last'};

      angular.mock.module(function($provide) {
        $provide.value('notificationFactory', self.notificationFactory);
        $provide.value('gracePeriodService', self.gracePeriodService);
        $provide.value('esnI18nService', {
          translate: function(input) { return input; }
        });
      });
    });

    beforeEach(angular.mock.inject(function($httpBackend, $rootScope, $q, _ICAL_, DAV_PATH, GRACE_DELAY, _CONTACT_EVENTS_, deleteContact) {
      this.$httpBackend = $httpBackend;
      this.$rootScope = $rootScope;
      this.deleteContact = deleteContact;
      this.DAV_PATH = DAV_PATH;
      this.GRACE_DELAY = GRACE_DELAY;

      this.getVCardUrl = function(bookId, bookName, cardId) {
        return [
          this.DAV_PATH,
          'addressbooks',
          bookId,
          bookName,
          cardId + '.vcf'
        ].join('/');
      };

      CONTACT_EVENTS = _CONTACT_EVENTS_;
    }));

    beforeEach(function() {
      this.notificationFactory.weakInfo = function() {};
      this.notificationFactory.weakError = function() {};
    });

    it('should call gracePeriodService with correct data', function() {
      this.gracePeriodService.grace = sinon.spy($q.when.bind(null));

      var expectPath = this.getVCardUrl(bookId, bookName, contact.id) + '?graceperiod=' + this.GRACE_DELAY;

      this.$httpBackend.expectDELETE(expectPath).respond(function() {
        return [204, '', {'X-ESN-TASK-ID': 'myTaskId'}];
      });
      contact.displayName = 'Foo Bar';
      this.deleteContact(bookId, bookName, contact);

      this.$rootScope.$apply();
      this.$httpBackend.flush();
      expect(this.gracePeriodService.grace).to.have.been.calledWith({
        id: 'myTaskId',
        performedAction: 'You have just deleted a contact (%s)',
        cancelFailed: 'Cannot cancel contact deletion, the contact might be deleted permanently',
        cancelTooLate: 'It is too late to cancel the contact deletion, the contact might be deleted permanently'
      });
    });

    it('should display error when on remove failure', function() {
      this.notificationFactory.weakError = sinon.spy();

      // make the remove failure by passing undefined contact ID
      this.deleteContact(bookId, bookName, { firstName: 'I have no id' });
      this.$rootScope.$apply();
      expect(this.notificationFactory.weakError).to.have.been.calledOnce;
    });

    it('should not grace the request on failure', function() {
      this.gracePeriodService.grace = sinon.spy();

      // make the remove failure by passing undefined contact ID
      this.deleteContact(bookId, bookName, { firstName: 'I have no id' });
      this.$rootScope.$apply();

      expect(this.gracePeriodService.grace).to.have.not.been.called;
    });

    it('should grace the request using the default delay on success', function(done) {
      var expectPath = this.getVCardUrl(bookId, bookName, contact.id) + '?graceperiod=' + this.GRACE_DELAY;

      this.$httpBackend.expectDELETE(expectPath).respond(function() {
        return [204, '', {'X-ESN-TASK-ID': 'myTaskId'}];
      });

      this.gracePeriodService.grace = function(taskId, text, linkText, delay) {
        expect(delay).to.not.exist;
        done();
      };

      this.deleteContact(bookId, bookName, contact);
      this.$rootScope.$apply();
      this.$httpBackend.flush();
    });

    it('should broadcast CONTACT_EVENTS.DELETED when contact is deleted successful', function() {
      this.gracePeriodService.grace = function() {
        return $q.when();
      };

      var expectPath = this.getVCardUrl(bookId, bookName, contact.id) + '?graceperiod=' + this.GRACE_DELAY;

      this.$httpBackend.expectDELETE(expectPath).respond(function() {
        return [204, '', {'X-ESN-TASK-ID': 'myTaskId'}];
      });

      var spy = sinon.spy();
      this.$rootScope.$on(CONTACT_EVENTS.DELETED, spy);

      this.deleteContact(bookId, bookName, contact);
      this.$rootScope.$apply();
      this.$httpBackend.flush();
      expect(spy).to.have.been.calledWith(sinon.match.any, sinon.match.same(contact));
    });

    it('should broadcast CONTACT_EVENTS.CANCEL_DELETE on successful cancellation of a request', function() {
      this.gracePeriodService.grace = function() {
        return $q.reject();
      };
      var expectPath = this.getVCardUrl(bookId, bookName, contact.id) + '?graceperiod=' + this.GRACE_DELAY;
      this.$httpBackend.expectDELETE(expectPath).respond(function() {
        return [204, '', {'X-ESN-TASK-ID': 'myTaskId'}];
      });

      var spy = sinon.spy();
      this.$rootScope.$on(CONTACT_EVENTS.CANCEL_DELETE, spy);

      this.deleteContact(bookId, bookName, contact);
      this.$rootScope.$apply();
      this.$httpBackend.flush();
      expect(spy).to.have.been.calledWith(sinon.match.any, sinon.match.same(contact));
    });

  });

  describe('The ContactLocationHelper service', function() {

    beforeEach(function() {
      var self = this;
      self.$location = { url: angular.noop };
      angular.mock.module(function($provide) {
        $provide.value('$location', self.$location);
      });
    });

    beforeEach(angular.mock.inject(function(ContactLocationHelper) {
      this.ContactLocationHelper = ContactLocationHelper;
    }));

    describe('The contact object', function() {

      describe('The new fn', function() {

        it('should call location.url with correct params', function() {
          this.$location.url = function(url) {
            expect(url).to.equal(['/contact', 'new', bookId, bookName].join('/'));
          };
          this.ContactLocationHelper.contact.new(bookId, bookName);
        });
      });
    });

  });
});
