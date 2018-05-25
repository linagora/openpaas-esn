'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The deleteContact service', function() {

  var CONTACT_EVENTS, contact, contactService;
  var bookId = 'bookId';
  var bookName = 'bookName';

  beforeEach(function() {
    module('esn.core');
    module('esn.websocket');
    module('esn.api-notification');
    module('linagora.esn.contact');
  });

  beforeEach(function() {
    var self = this;
    this.notificationFactory = {};
    this.gracePeriodService = {};

    contact = {
      id: '00000000-0000-4000-a000-000000000000',
      lastName: 'Last',
      addressbook: {
        bookId: '123',
        bookName: 'contacts'
      }
    };

    angular.mock.module(function($provide) {
      $provide.value('notificationFactory', self.notificationFactory);
      $provide.value('gracePeriodService', self.gracePeriodService);
      $provide.value('esnI18nService', {
        translate: function(input) { return input; }
      });
    });
  });

  beforeEach(angular.mock.inject(function($httpBackend, $rootScope, $q, _ICAL_, DAV_PATH, GRACE_DELAY, _CONTACT_EVENTS_, deleteContact, _contactService_) {
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
    contactService = _contactService_;
  }));

  beforeEach(function() {
    this.notificationFactory.weakInfo = function() {};
    this.notificationFactory.weakError = function() {};
  });

  it('should call gracePeriodService with correct data', function() {
    this.gracePeriodService.grace = sinon.spy($q.when.bind(null));

    contact.displayName = 'Foo Bar';
    contactService.removeContact = sinon.stub().returns($q.when('myTaskId'));
    this.deleteContact(bookId, bookName, contact);

    this.$rootScope.$digest();
    expect(this.gracePeriodService.grace).to.have.been.calledWith({
      id: 'myTaskId',
      performedAction: 'You have just deleted a contact (%s)',
      cancelFailed: 'Cannot cancel contact deletion, the contact might be deleted permanently',
      cancelTooLate: 'It is too late to cancel the contact deletion, the contact might be deleted permanently'
    });
  });

  it('should display error when on remove failure', function() {
    this.notificationFactory.weakError = sinon.spy();

    var contact = {
      firstName: 'I have no id',
      addressbook: {
        bookId: bookId,
        bookName: bookName
      }
    };

    contactService.removeContact = sinon.stub().returns($q.reject());
    this.deleteContact(bookId, bookName, contact);
    this.$rootScope.$apply();
    expect(this.notificationFactory.weakError).to.have.been.calledOnce;
  });

  it('should not grace the request on failure', function() {
    this.gracePeriodService.grace = sinon.spy();

    var contact = {
      firstName: 'I have no id',
      addressbook: {
        bookId: bookId,
        bookName: bookName
      }
    };

    contactService.removeContact = sinon.stub().returns($q.reject());
    this.deleteContact(bookId, bookName, contact);
    this.$rootScope.$apply();

    expect(this.gracePeriodService.grace).to.have.not.been.called;
  });

  it('should grace the request using the default delay on success', function(done) {
    contactService.removeContact = sinon.stub().returns($q.when('myTaskId'));
    this.gracePeriodService.grace = function(taskId, text, linkText, delay) {
      expect(delay).to.not.exist;
      done();
    };

    this.deleteContact(bookId, bookName, contact);
    this.$rootScope.$apply();
  });

  it('should broadcast CONTACT_EVENTS.DELETED when contact is deleted successful', function() {
    this.gracePeriodService.grace = function() {
      return $q.when();
    };

    contactService.removeContact = sinon.stub().returns($q.when());

    var spy = sinon.spy();
    this.$rootScope.$on(CONTACT_EVENTS.DELETED, spy);

    this.deleteContact(bookId, bookName, contact);
    this.$rootScope.$apply();
    expect(spy).to.have.been.calledWith(sinon.match.any, sinon.match.same(contact));
  });

  it('should broadcast CONTACT_EVENTS.CANCEL_DELETE on successful cancellation of a request', function() {
    this.gracePeriodService.grace = function() {
      return $q.reject();
    };
    contactService.removeContact = sinon.stub().returns($q.when());

    var spy = sinon.spy();
    this.$rootScope.$on(CONTACT_EVENTS.CANCEL_DELETE, spy);

    this.deleteContact(bookId, bookName, contact);
    this.$rootScope.$apply();
    expect(spy).to.have.been.calledWith(sinon.match.any, sinon.match.same(contact));
  });

});
