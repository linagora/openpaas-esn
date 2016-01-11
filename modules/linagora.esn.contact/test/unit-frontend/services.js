'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The Contacts Angular module services', function() {

  beforeEach(function() {
    module('esn.core');
    module('esn.websocket');
    module('esn.api-notification');
    module('linagora.esn.contact');
  });

  describe('The liveRefreshContactService service', function() {
    var liveNotificationMock, onFn, removeListenerFn;
    var $rootScope, liveRefreshContactService, CONTACT_SIO_EVENTS;
    var namespace = '/contacts';
    var session = {};

    beforeEach(function() {
      session = {};
      onFn = sinon.spy();
      removeListenerFn = sinon.spy();
      liveNotificationMock = sinon.stub().returns({
        on: onFn,
        removeListener: removeListenerFn
      });

      module(function($provide) {
        $provide.value('livenotification', liveNotificationMock);
        $provide.value('session', session);
      });

      inject(function(_$rootScope_, _liveRefreshContactService_, _CONTACT_SIO_EVENTS_) {
        $rootScope = _$rootScope_;
        liveRefreshContactService = _liveRefreshContactService_;
        CONTACT_SIO_EVENTS = _CONTACT_SIO_EVENTS_;
      });

    });

    describe('The startListen fn', function() {

      it('should be called when user switches to contact module', function() {
        session.user = {_id: 1};
        $rootScope.$broadcast('$stateChangeSuccess', {
          name: '/contact'
        });
        expect(onFn.callCount).to.equal(3);
      });

      it('should subscribe /contacts namespace with bookId', function() {
        var bookId = 'some book id';
        liveRefreshContactService.startListen(bookId);
        expect(liveNotificationMock.calledOnce).to.be.true;
        expect(liveNotificationMock.calledWithExactly(namespace, bookId)).to.be.true;
      });

      it('should make sio to listen on CONTACT_SIO_EVENTS.CREATED event', function() {
        var bookId = 'some book id';
        liveRefreshContactService.startListen(bookId);
        expect(onFn.firstCall.calledWith(CONTACT_SIO_EVENTS.CREATED)).to.be.true;
      });

      it('should make sio to listen on CONTACT_SIO_EVENTS.DELETED event', function() {
        var bookId = 'some book id';
        liveRefreshContactService.startListen(bookId);
        expect(onFn.secondCall.calledWith(CONTACT_SIO_EVENTS.DELETED)).to.be.true;
      });

      it('should make sio to listen on CONTACT_SIO_EVENTS.UPDATED event', function() {
        var bookId = 'some book id';
        liveRefreshContactService.startListen(bookId);
        expect(onFn.thirdCall.calledWith(CONTACT_SIO_EVENTS.UPDATED)).to.be.true;
      });

    });

    describe('The stopListen fn', function() {

      it('should be call when user switches to outside contact module', function() {
        var bookId = 'some book id';
        liveRefreshContactService.startListen(bookId);

        $rootScope.$broadcast('$stateChangeSuccess', {
          name: '/other/module/path'
        });

        expect(removeListenerFn.callCount).to.equal(3);
      });

      it('should make sio to remove CONTACT_SIO_EVENTS.CREATED event listener', function() {
        var bookId = 'some book id';
        liveRefreshContactService.startListen(bookId);

        liveRefreshContactService.stopListen();
        expect(removeListenerFn.firstCall.calledWith(CONTACT_SIO_EVENTS.CREATED)).to.be.true;
      });

      it('should make sio to remove CONTACT_SIO_EVENTS.DELETED event listener', function() {
        var bookId = 'some book id';
        liveRefreshContactService.startListen(bookId);

        liveRefreshContactService.stopListen();
        expect(removeListenerFn.secondCall.calledWith(CONTACT_SIO_EVENTS.DELETED)).to.be.true;
      });

      it('should make sio to remove CONTACT_SIO_EVENTS.UPDATED event listener', function() {
        var bookId = 'some book id';
        liveRefreshContactService.startListen(bookId);

        liveRefreshContactService.stopListen();
        expect(removeListenerFn.thirdCall.calledWith(CONTACT_SIO_EVENTS.UPDATED)).to.be.true;
      });

    });

  });

  describe('The shellToVCARD fn', function() {
    var shellToVCARD;

    beforeEach(angular.mock.inject(function(_shellToVCARD_) {
      shellToVCARD = _shellToVCARD_;
    }));

    function compareShell(shell, ical) {
      var vcard = shellToVCARD(shell);
      var properties = vcard.getAllProperties();
      var propkeys = properties.map(function(p) {
        return p.name;
      }).sort();
      var icalkeys = Object.keys(ical).sort();

      var message = 'Key count mismatch in ical object.\n' +
                    'expected: ' + icalkeys + '\n' +
                    '   found: ' + propkeys;
      expect(properties.length).to.equal(icalkeys.length, message);

      for (var propName in ical) {
        var prop = vcard.getFirstProperty(propName);
        expect(prop, 'Missing: ' + propName).to.be.ok;
        var value = prop.toICAL();
        expect(value).to.equal(ical[propName].toString());
      }
    }

    it('should correctly create a card with display name', function() {
      var shell = {
        id: '00000000-0000-4000-a000-000000000000',
        displayName: 'display name'
      };
      var ical = {
        version: 'VERSION:4.0',
        uid: 'UID:00000000-0000-4000-a000-000000000000',
        fn: 'FN:display name'
      };

      compareShell(shell, ical);
    });

    it('should correctly create a card with first/last name', function() {
      var shell = {
        id: '00000000-0000-4000-a000-000000000000',
        lastName: 'last',
        firstName: 'first'
      };
      var ical = {
        version: 'VERSION:4.0',
        uid: 'UID:00000000-0000-4000-a000-000000000000',
        fn: 'FN:first last',
        n: 'N:last;first'
      };

      compareShell(shell, ical);
    });

    it('should correctly create a card with all props', function() {
      var shell = {
        id: '00000000-0000-4000-a000-000000000000',
        lastName: 'last',
        firstName: 'first',
        starred: true,
        tags: [{ text: 'a' }, { text: 'b'}],
        emails: [{ type: 'Home', value: 'email@example.com' }],
        tel: [{ type: 'Home', value: '123123' }],
        addresses: [{ type: 'Home', street: 's', city: 'c', zip: 'z', country: 'co' }],
        social: [{ type: 'Twitter', value: '@AwesomePaaS' }],
        orgName: 'org',
        orgRole: 'role',
        urls: [{ value: 'http://mywebsite.com' }],
        birthday: new Date(2015, 0, 1),
        nickname: 'nick',
        notes: 'notes',
        photo: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAA'
      };
      var ical = {
        version: 'VERSION:4.0',
        uid: 'UID:00000000-0000-4000-a000-000000000000',
        fn: 'FN:first last',
        n: 'N:last;first',
        email: 'EMAIL;TYPE=Home:mailto:email@example.com',
        adr: 'ADR;TYPE=Home:;;s;c;;z;co',
        tel: 'TEL;TYPE=Home:tel:123123',
        org: 'ORG:org',
        url: 'URL:http://mywebsite.com',
        role: 'ROLE:role',
        socialprofile: 'SOCIALPROFILE;TYPE=Twitter:@AwesomePaaS',
        categories: 'CATEGORIES:a,b,starred',
        bday: 'BDAY;VALUE=DATE:20150101',
        nickname: 'NICKNAME:nick',
        note: 'NOTE:notes',
        photo: 'PHOTO:data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAA'
      };

      compareShell(shell, ical);
    });

    it('should correctly create a card when birthday is not a Date', function() {
      var shell = {
        id: '00000000-0000-4000-a000-000000000000',
        birthday: 'not sure about the birthday'
      };
      var ical = {
        version: 'VERSION:4.0',
        uid: 'UID:00000000-0000-4000-a000-000000000000',
        fn: 'FN:not sure about the birthday',
        bday: 'BDAY;VALUE=TEXT:not sure about the birthday'
      };

      compareShell(shell, ical);
    });

  });

  describe('The deleteContact service', function() {
    var bookId = 'bookId';
    var bookName = 'bookName';

    var CONTACT_EVENTS, contact;

    beforeEach(function() {
      var self = this;
      this.notificationFactory = {};
      this.gracePeriodService = {};
      this.gracePeriodLiveNotification = {};

      contact = { id: '00000000-0000-4000-a000-000000000000', lastName: 'Last'};

      angular.mock.module(function($provide) {
        $provide.value('notificationFactory', self.notificationFactory);
        $provide.value('gracePeriodService', self.gracePeriodService);
        $provide.value('gracePeriodLiveNotification', self.gracePeriodLiveNotification);
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
      this.gracePeriodLiveNotification.registerListeners = function() {};
    });

    it('should display correct title and link during the grace period', function(done) {
      this.gracePeriodService.grace = function(taskId, text, linkText, delay) {
        expect(taskId).to.equals('myTaskId');
        expect(text).to.equals('You have just deleted a contact (Foo Bar).');
        expect(linkText).to.equals('Cancel');
        expect(delay).to.not.exist;
        done();
      };

      var expectPath = this.getVCardUrl(bookId, bookName, contact.id) + '?graceperiod=' + this.GRACE_DELAY;
      this.$httpBackend.expectDELETE(expectPath).respond(function(method, url, data, headers) {
        return [204, '', {'X-ESN-TASK-ID': 'myTaskId'}];
      });
      contact.displayName = 'Foo Bar';
      this.deleteContact(bookId, bookName, contact);

      this.$rootScope.$apply();
      this.$httpBackend.flush();
    });

    it('should display error when on remove failure', function(done) {
      this.notificationFactory.weakError = function() {
        done();
      };

      // make the remove failure by passing undefined contact ID
      this.deleteContact(bookId, bookName, { firstName: 'I have no id' });
      this.$rootScope.$apply();
      done(new Error());
    });

    it('should not grace the request on failure', function() {
      this.gracePeriodService.grace = sinon.spy();

      // make the remove failure by passing undefined contact ID
      this.deleteContact(bookId, bookName, { firstName: 'I have no id' });
      this.$rootScope.$apply();

      expect(this.gracePeriodService.grace.callCount).to.equal(0);
    });

    it('should grace the request using the default delay on success', function(done) {
      var expectPath = this.getVCardUrl(bookId, bookName, contact.id) + '?graceperiod=' + this.GRACE_DELAY;
      this.$httpBackend.expectDELETE(expectPath).respond(function(method, url, data, headers) {
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

    it('should register grace live notification on success', function(done) {
      var expectPath = this.getVCardUrl(bookId, bookName, contact.id) + '?graceperiod=' + this.GRACE_DELAY;
      this.$httpBackend.expectDELETE(expectPath).respond(function(method, url, data, headers) {
        return [204, '', {'X-ESN-TASK-ID': 'myTaskId'}];
      });

      this.notificationFactory.strongError = sinon.spy();
      var onCancelDeleteSpy = sinon.spy();
      this.$rootScope.$on(CONTACT_EVENTS.CANCEL_DELETE, onCancelDeleteSpy);

      var self = this;

      this.gracePeriodLiveNotification.registerListeners = function(taskId, onError) {
        expect(taskId).to.equal('myTaskId');
        onError();
        expect(self.notificationFactory.strongError.callCount).to.equal(1);
        expect(onCancelDeleteSpy.callCount).to.equal(1);
        done();
      };

      this.deleteContact(bookId, bookName, contact);
      this.$rootScope.$apply();
      this.$httpBackend.flush();
    });

    it('should cancel the request if the user cancels during the grace period', function(done) {
      this.gracePeriodService.grace = function() {
        return $q.when({
          cancelled: true,
          success: function() {},
          error: function() {}
        });
      };

      this.gracePeriodService.cancel = function(taskId) {
        expect(taskId).to.equal('myTaskId');
        done();
      };

      var expectPath = this.getVCardUrl(bookId, bookName, contact.id) + '?graceperiod=' + this.GRACE_DELAY;
      this.$httpBackend.expectDELETE(expectPath).respond(function(method, url, data, headers) {
        return [204, '', {'X-ESN-TASK-ID': 'myTaskId'}];
      });

      this.deleteContact(bookId, bookName, contact);
      this.$rootScope.$apply();
      this.$httpBackend.flush();

    });

    it('should notify the user that the contact deletion cannot be cancelled', function(done) {
      this.gracePeriodService.grace = function() {
        return $q.when({
          cancelled: true,
          success: function() {},
          error: function() { done(); }
        });
      };

      this.gracePeriodService.cancel = function(taskId) {
        expect(taskId).to.equal('myTaskId');
        return $q.reject();
      };

      var expectPath = this.getVCardUrl(bookId, bookName, contact.id) + '?graceperiod=' + this.GRACE_DELAY;
      this.$httpBackend.expectDELETE(expectPath).respond(function(method, url, data, headers) {
        return [204, '', {'X-ESN-TASK-ID': 'myTaskId'}];
      });

      this.deleteContact(bookId, bookName, contact);
      this.$rootScope.$apply();
      this.$httpBackend.flush();
    });

    it('should broadcast CONTACT_EVENTS.DELETED when contact is deleted successful', function(done) {
      var expectPath = this.getVCardUrl(bookId, bookName, contact.id) + '?graceperiod=' + this.GRACE_DELAY;
      this.$httpBackend.expectDELETE(expectPath).respond(function(method, url, data, headers) {
        return [204, '', {'X-ESN-TASK-ID': 'myTaskId'}];
      });

      this.$rootScope.$on(CONTACT_EVENTS.DELETED, function(evt, data) {
        expect(data).to.eql(contact);
        done();
      });

      this.deleteContact(bookId, bookName, contact);
      this.$rootScope.$apply();
      this.$httpBackend.flush();
    });

    it('should broadcast CONTACT_EVENTS.CANCEL_DELETE on successful cancellation of a request', function(done) {
      this.gracePeriodService.grace = function() {
        return $q.when({
          cancelled: true,
          success: function() {},
          error: function(textToDisplay) {}
        });
      };
      this.gracePeriodService.cancel = function() {
        return $q.when();
      };

      var expectPath = this.getVCardUrl(bookId, bookName, contact.id) + '?graceperiod=' + this.GRACE_DELAY;
      this.$httpBackend.expectDELETE(expectPath).respond(function(method, url, data, headers) {
        return [204, '', {'X-ESN-TASK-ID': 'myTaskId'}];
      });

      this.$rootScope.$on(CONTACT_EVENTS.CANCEL_DELETE, function(evt, data) {
        expect(data).to.eql(contact);
        done();
      });

      this.deleteContact(bookId, bookName, contact);
      this.$rootScope.$apply();
      this.$httpBackend.flush();

    });

  }); // The deleteContact service

  describe('The ContactsHelper service', function() {

    beforeEach(angular.mock.inject(function(ContactsHelper, $rootScope, _ICAL_) {
      this.$rootScope = $rootScope;
      this.contactHelper = ContactsHelper;
      this.ICAL = _ICAL_;
    }));

    describe('The fillScopeContactData function', function() {

      it('should not modify scope when contact is undefined', function() {
        var scope = {};
        this.contactHelper.fillScopeContactData(scope);
        expect(scope).to.deep.equal({});
      });

      it('should fill the scope with the contact', function() {
        var scope = {};
        var contact = {emails: [{type: 'work', value: 'me@work.com'}, {type: 'home', value: 'me@home.com'}]};
        this.contactHelper.fillScopeContactData(scope, contact);
        expect(scope.contact).to.deep.equal(contact);
      });

      it('should fill the scope with the contact emails', function() {
        var scope = {};
        var contact = {emails: [{type: 'work', value: 'me@work.com'}, {type: 'home', value: 'me@home.com'}]};
        this.contactHelper.fillScopeContactData(scope, contact);
        expect(scope.emails.length).to.equal(2);
      });

      it('should fill the scope with the contact phones', function() {
        var scope = {};
        var contact = {tel: [{type: 'work', value: '+33333333'}, {type: 'home', value: '+33444444'}]};
        this.contactHelper.fillScopeContactData(scope, contact);
        expect(scope.phones.length).to.equal(2);
      });

      it('should fill the scope with the contact formattedBirthday', function() {
        var scope = {};
        var contact = {birthday: '123', tel: [{type: 'work', value: '+33333333'}, {type: 'home', value: '+33444444'}]};
        this.contactHelper.fillScopeContactData(scope, contact);
        expect(scope.formattedBirthday).to.be.defined;
      });
    });

    describe('The getOrderedValues function', function() {
      it('should return empty array when input is undefined', function() {
        expect(this.contactHelper.getOrderedValues()).to.deep.equal([]);
      });

      it('should return empty array when input is input array', function() {
        expect(this.contactHelper.getOrderedValues([])).to.deep.equal([]);
      });

      it('should return ordered elements based on given priority', function() {
        var a = {type: 'a', value: 1};
        var b = {type: 'b', value: 2};
        var c = {type: 'c', value: 3};
        expect(this.contactHelper.getOrderedValues([a, b, c], ['b', 'c', 'a'])).to.deep.equal([b, c, a]);
      });

      it('should return input when priorities are not defined', function() {
        var a = {type: 'a', value: 1};
        var b = {type: 'b', value: 2};
        var c = {type: 'c', value: 3};
        expect(this.contactHelper.getOrderedValues([a, b, c])).to.deep.equal([a, b, c]);
      });

      it('should return input when priorities are empty', function() {
        var a = {type: 'a', value: 1};
        var b = {type: 'b', value: 2};
        var c = {type: 'c', value: 3};
        expect(this.contactHelper.getOrderedValues([a, b, c], [])).to.deep.equal([a, b, c]);
      });

      it('should return only element with given priorities', function() {
        var a = {type: 'a', value: 1};
        var b = {type: 'b', value: 2};
        var c = {type: 'c', value: 3};
        var d = {type: 'd', value: 4};
        var e = {type: 'e', value: 5};
        expect(this.contactHelper.getOrderedValues([a, b, c, d, e], ['c', 'b', 'a'])).to.deep.equal([c, b, a]);
      });

      it('should return ordered elements based on given priority even when same types appears several times', function() {
        var a = {type: 'a', value: 1};
        var b = {type: 'b', value: 2};
        var c = {type: 'c', value: 3};
        var d = {type: 'd', value: 4};
        var e = {type: 'e', value: 6};
        var aa = {type: 'a', value: 5};
        var bb = {type: 'b', value: 7};
        expect(this.contactHelper.getOrderedValues([a, b, c, d, e, aa, bb], ['a', 'b'])).to.deep.equal([a, aa, b, bb]);
      });

    });

    describe('The getFormattedAddress function', function() {

      beforeEach(function() {
        this.expectEqual = function(value) {
          expect(this.contactHelper.getFormattedAddress(this.address)).to.equal(value);
        };
      });

      it('should return empty string when address is undefined', function() {
        expect(this.contactHelper.getFormattedAddress(this.address)).to.equal('');
      });

      it('should return street when address.street is only defined', function() {
        var street = 'My street';
        this.address = {street: street};
        this.expectEqual(street);
      });

      it('should return city when address.city is only defined', function() {
        var city = 'My city';
        this.address = {city: city};
        this.expectEqual(city);
      });

      it('should return zip when address.zip is only defined', function() {
        var zip = 'My zip';
        this.address = {zip: zip};
        this.expectEqual(zip);
      });

      it('should return country when address.country is only defined', function() {
        var country = 'My country';
        this.address = {country: country};
        this.expectEqual(country);
      });

      it('should return full string address when address is defined', function() {
        var street = 'My street';
        var city = 'My city';
        var zip = 'My zip';
        var country = 'My country';
        this.address = {street: street, city: city, zip: zip, country: country};
        this.expectEqual(street + ' ' + city + ' ' + zip + ' ' + country);
      });

    });

    describe('The getFormattedName function', function() {

      beforeEach(function() {

        this.homeEmail = { type: 'Home', value: 'home@example.com' };
        this.workEmail = { type: 'Work', value: 'work@example.com' };
        this.otherEmail = { type: 'Other', value: 'other@example.com' };

        this.twitter = { type: 'Twitter', value: '@AwesomePaaS' };
        this.google = { type: 'Google', value: '+AwesomePaaS' };
        this.linkedin = { type: 'Linkedin', value: 'AwesomePaaS.in' };
        this.fb = { type: 'Facebook', value: 'AwesomePaaS.fb' };
        this.skype = { type: 'Skype', value: 'AwesomePaaS.skype' };
        this.otherSocial = { type: 'Instagram', value: 'AwesomePaaS.instagram' };

        this.homeTel = { type: 'Home', value: '+11111111' };
        this.mobileTel = { type: 'Mobile', value: '+22222222' };
        this.workTel = { type: 'Work', value: '+33333333' };
        this.otherTel = { type: 'Other', value: '+44444444' };

        this.url = { value: 'http://linagora.com' };

      });

      beforeEach(function() {
        this.shell = {};

        this.expectEqual = function(value) {
          expect(this.contactHelper.getFormattedName(this.shell)).to.equal(value);
        };

        this.expectUndefined = function() {
          expect(this.contactHelper.getFormattedName(this.shell)).to.be.undefined;
        };
      });

      it('should return firstname when firstname defined and lastname undefined', function() {
        this.shell.firstName = 'Foo';
        this.expectEqual(this.shell.firstName);
      });

      it('should return lastname when firstname undefined and lastname defined', function() {
        this.shell.lastName = 'Bar';
        this.expectEqual(this.shell.lastName);
      });

      it('should return undefined when no values', function() {
        this.expectUndefined();
      });

      it('should return birthday as-is if defined but not a Date', function() {
        this.shell.birthday = 'I am not a date';
        this.expectEqual('I am not a date');
      });

      it('should return with the correct order', function() {
        this.shell = {
          firstName: 'Foo',
          lastName: 'Bar',
          orgName: 'MyOrg',
          orgRole: 'role',
          nickname: 'FooBar',
          emails: [this.workEmail, this.homeEmail, this.otherEmail],
          social: [this.twitter, this.skype, this.google, this.linkedin, this.fb, this.otherSocial],
          urls: [this.url],
          tel: [this.workTel, this.mobileTel, this.homeTel, this.otherTel],
          notes: 'This is a note',
          tags: [{text: 'A'}, {text: 'B'}],
          birthday: new Date(1942, 0, 1),
          addresses: [{street: 'My street', zip: 'My zip', city: 'My city', country: 'My country'}],
          starred: true,
          photo: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAA'
        };

        this.expectEqual(this.shell.firstName + ' ' + this.shell.lastName);

        this.shell.firstName = this.shell.lastName = '';
        this.expectEqual('MyOrg');

        this.shell.orgName = '';
        this.expectEqual('role');

        this.shell.orgRole = '';
        this.expectEqual('FooBar');

        this.shell.nickname = '';
        this.expectEqual(this.workEmail.value);

        this.shell.emails.shift();
        this.expectEqual(this.homeEmail.value);

        this.shell.emails.shift();
        this.expectEqual(this.otherEmail.value);

        this.shell.emails.shift();
        this.expectEqual(this.twitter.value);

        this.shell.social.shift();
        this.expectEqual(this.skype.value);

        this.shell.social.shift();
        this.expectEqual(this.google.value);

        this.shell.social.shift();
        this.expectEqual(this.linkedin.value);

        this.shell.social.shift();
        this.expectEqual(this.fb.value);

        this.shell.social.shift();
        this.expectEqual(this.otherSocial.value);

        this.shell.social.shift();
        this.expectEqual(this.url.value);

        this.shell.urls.shift();
        this.expectEqual(this.workTel.value);

        this.shell.tel.shift();
        this.expectEqual(this.mobileTel.value);

        this.shell.tel.shift();
        this.expectEqual(this.homeTel.value);

        this.shell.tel.shift();
        this.expectEqual(this.otherTel.value);

        this.shell.tel.shift();
        this.expectEqual('This is a note');

        this.shell.notes = '';
        this.expectEqual('A');

        this.shell.tags.shift();
        this.expectEqual('B');

        this.shell.tags.shift();
        this.expectEqual('01/01/1942');

        this.shell.birthday = '';
        this.expectEqual('My street My city My zip My country');
      });
    });

    describe('The forceReloadDefaultAvatar fn', function() {

      it('should append timestamp to default avatar url', function() {
        var contact = { photo: 'http://abc.com/contact/api/contacts/123/456/avatar' };
        this.contactHelper.forceReloadDefaultAvatar(contact);
        expect(contact.photo).to.match(/123\/456\/avatar\?t=[0-10]+/);
      });

      it('should append timestamp parameter correctly', function() {
        var contact = { photo: 'http://abc.com/contact/api/contacts/123/456/avatar?x=1&y=2' };
        this.contactHelper.forceReloadDefaultAvatar(contact);
        expect(contact.photo).to.match(/123\/456\/avatar\?x=1&y=2&t=[0-10]+/);
      });

      it('should update timestamp parameter if exist', function() {
        var photoUrl = 'http://abc.com/contact/api/contacts/123/456/avatar?t=1';
        var contact = { photo: photoUrl };
        this.contactHelper.forceReloadDefaultAvatar(contact);
        expect(contact.photo).to.match(/123\/456\/avatar\?t=[0-10]+/);
        expect(contact.photo).to.not.equal(photoUrl);
      });

      it('should not append timestamp to custom avatar url', function() {
        var avatarUrl = 'http://abc.com/this/is/my/cuties/avatar';
        var contact = { photo: avatarUrl };
        this.contactHelper.forceReloadDefaultAvatar(contact);
        expect(contact.photo).to.equal(avatarUrl);
      });

      it('should upate the photo value in vcard', function() {
        var vcard = new this.ICAL.Component(['vcard', [
            ['version', {}, 'text', '4.0'],
            ['uid', {}, 'text', 'myuid'],
            ['photo', {}, 'uri', 'http://abc.com/contact/api/contacts/123/456/avatar']
        ]]);
        var contact = { photo: 'http://abc.com/contact/api/contacts/123/456/avatar', vcard: vcard };
        this.contactHelper.forceReloadDefaultAvatar(contact);
        expect(contact.photo).to.match(/123\/456\/avatar\?t=[0-10]+/);
        expect(contact.vcard.getFirstPropertyValue('photo')).to.match(/123\/456\/avatar\?t=[0-10]+/);
      });

    });

    describe('The isTextAvatar fn', function() {

      it('should return true if URL is in form of text avatar', function() {
        var url = 'http://abc.com/contact/api/contacts/123/456/avatar';
        expect(this.contactHelper.isTextAvatar(url)).to.be.true;
      });

      it('should return false if URL is not in form of text avatar', function() {
        var url = 'http://abc.com/contact/api/contacts/123/456/not_text_avatar';
        expect(this.contactHelper.isTextAvatar(url)).to.be.false;
      });

    });

  });

  describe('The toggleContactDisplayService', function() {
    var $rootScope,
      $cacheFactory,
      toggleContactDisplayService,
      toggleEventService,
      CONTACT_LIST_DISPLAY,
      CONTACT_LIST_DISPLAY_EVENTS;

    var toggleEventServiceMock = {
      broadcast: function() {},
      listen: function() {}
    };

    beforeEach(function() {

      module(function($provide) {
        $provide.value('toggleEventService', toggleEventServiceMock);
      });
      inject(function(_$rootScope_, _toggleContactDisplayService_, _toggleEventService_, _CONTACT_LIST_DISPLAY_, _CONTACT_LIST_DISPLAY_EVENTS_, _$cacheFactory_) {
        $rootScope = _$rootScope_;
        toggleContactDisplayService = _toggleContactDisplayService_;
        toggleEventService = _toggleEventService_;
        CONTACT_LIST_DISPLAY = _CONTACT_LIST_DISPLAY_;
        CONTACT_LIST_DISPLAY_EVENTS = _CONTACT_LIST_DISPLAY_EVENTS_;
        $cacheFactory = _$cacheFactory_;
      });
    });

    describe('The getInitialDisplay function', function() {

      it('should return list as default value', function() {
        expect(toggleContactDisplayService.getInitialDisplay()).to.equal(CONTACT_LIST_DISPLAY.list);
      });

      it('should return the data from cache when current is not defined', function() {
        var value = CONTACT_LIST_DISPLAY.cards;
        toggleContactDisplayService._cacheValue(value);
        expect(toggleContactDisplayService.getInitialDisplay()).to.equal(value);
      });

    });

    describe('The getCurrentDisplay function', function() {

      it('should return list as default value when current is not defind', function() {
        expect(toggleContactDisplayService.getCurrentDisplay()).to.equal(CONTACT_LIST_DISPLAY.list);
      });

      it('should return the current value', function() {
        var value = 'foo';
        toggleContactDisplayService.setCurrentDisplay(value);
        expect(toggleContactDisplayService.getCurrentDisplay()).to.equal(value);
      });

    });

    describe('The setCurrentDisplay function', function() {
      it('should cache value', function() {
        var value = 'foo';
        toggleContactDisplayService.setCurrentDisplay(value);
        expect(toggleContactDisplayService._getCacheValue()).to.equal(value);
      });

      it('should cache value', function() {
        var value = 'foo';
        toggleContactDisplayService.setCurrentDisplay(value);
        expect(toggleContactDisplayService._getCacheValue()).to.equal(value);
      });

      it('should set current value', function() {
        var value = 'foo';
        toggleContactDisplayService.setCurrentDisplay(value);
        expect(toggleContactDisplayService.getCurrentDisplay()).to.equal(value);
      });

      it('should broadcast event', function(done) {
        var value = 'foo';
        toggleEventServiceMock.broadcast = function() {
          done();
        };
        toggleContactDisplayService.setCurrentDisplay(value);
        expect(toggleContactDisplayService.getCurrentDisplay()).to.equal(value);
      });

    });

    describe('The _getCache function', function() {
      it('should return an object', function() {
        expect(toggleContactDisplayService._getCache()).to.be.an.object;
      });
    });

    describe('The cache value functions', function() {
      it('should be able to get a cached value', function() {
        var value = 'foobar';
        toggleContactDisplayService._cacheValue(value);
        expect(toggleContactDisplayService._getCacheValue()).to.equal(value);
      });
    });
  });

  describe('The toggleEventService service', function() {
    var $rootScope,
      toggleEventService,
      CONTACT_LIST_DISPLAY_EVENTS;

    beforeEach(function() {
      inject(function(_$rootScope_, _toggleEventService_, _CONTACT_LIST_DISPLAY_EVENTS_) {
        $rootScope = _$rootScope_;
        toggleEventService = _toggleEventService_;
        CONTACT_LIST_DISPLAY_EVENTS = _CONTACT_LIST_DISPLAY_EVENTS_;
      });
    });

    describe('The broadcast function', function() {
      it('should call $rootScope.$broadcast with toggle event', function(done) {

        var data = 'My event';
        $rootScope.$on(CONTACT_LIST_DISPLAY_EVENTS.toggle, function(evt, value) {
          expect(value).to.equal(data);
          done();
        });

        toggleEventService.broadcast(data);
      });
    });

    describe('The listen function', function() {
      it('should listen to toggle event', function(done) {

        var eventCallback = function() {};
        var scope = {
          $on: function(event, callback) {
            expect(CONTACT_LIST_DISPLAY_EVENTS.toggle).to.equal(event);
            expect(callback).to.equal(eventCallback);
            done();
          }
        };
        toggleEventService.listen(scope, eventCallback);
      });

      it('should call event callback', function(done) {
        var event = 'My event';
        var scope = $rootScope.$new();
        function callback(evt, data) {
          expect(data).to.equal(event);
          done();
        }
        toggleEventService.listen(scope, callback);
        toggleEventService.broadcast(event);
      });
    });

  });

  describe('The addScrollingBehavior service', function() {
    var $rootScope, $window, event, $scope;
    var addScrollingBehavior, sharedContactDataService, scrollingBehavior;
    var angularFind;
    var letterOffset = 0,
      contactHeaderOffset = 0,
      contactControlOffset = 0;

    var angularFindResult = {
      h2: {
        getBoundingClientRect: function() {
          return {
            bottom: letterOffset
          };
        }
      },
      blockHeader: {
        textContent: 'A',
        getElementsByTagName: function() {
          return [angularFindResult.h2];
        }
      },
      contactControl: {
        getBoundingClientRect: function() {
          return {
            bottom: contactHeaderOffset
          };
        }
      },
      contactHeader: {
        getBoundingClientRect: function() {
          return {
            bottom: contactControlOffset
          };
        }
      }
    };

    var element = {
      find: function() {
        return $([angularFindResult.blockHeader]);
      }
    };

    beforeEach(function() {
      // Simulate angular.element.find and restore after
      angularFind = angular.element.find;
      angular.element.find = function(value) {
        switch (value) {
          case '.contact-controls':
            return [angularFindResult.contactControl];
          case '.contacts-list-header':
            return [angularFindResult.contactHeader];
        }
      };

      inject(function(_$rootScope_, _$window_, _addScrollingBehavior_, _CONTACT_SCROLL_EVENTS_, _sharedContactDataService_) {
        $rootScope = _$rootScope_;
        $scope = $rootScope.$new();
        $window = _$window_;
        addScrollingBehavior = _addScrollingBehavior_;
        sharedContactDataService = _sharedContactDataService_;
        event = _CONTACT_SCROLL_EVENTS_;
      });

      scrollingBehavior = addScrollingBehavior(element);
      sharedContactDataService.categoryLetter = '#';
    });

    afterEach(function() {
      angular.element.find = angularFind;
      angular.element($window).off('scroll');
    });

    it('should not broadcast the letter when it is not hidden', function(done) {
      letterOffset = 100;
      contactHeaderOffset = 0;
      sharedContactDataService.categoryLetter = '';
      $scope.$on(event, function() {
        done('Error');
      });
      angular.element($window).triggerHandler('scroll');
      done();
    });

    it('should not broadcast the letter when it is not changed', function(done) {
      letterOffset = 100;
      contactHeaderOffset = 200;
      sharedContactDataService.categoryLetter = 'A';
      $scope.$on(event, function() {
        done('Error');
      });
      angular.element($window).triggerHandler('scroll');
      done();
    });

    it('should broadcast the letter when it is changed', function() {
      letterOffset = 100;
      contactHeaderOffset = 200;
      $scope.$on(event, function(evt, data) {
        expect(data).to.deep.equal('A');
      });
      angular.element($window).triggerHandler('scroll');
    });

    it('should return the function to remove scroll listener', function(done) {
      var angularElement = angular.element;
      angular.element = function() {
        return {
          off: function() {
            done();
          }
        };
      };

      scrollingBehavior.unregister();
      angular.element = angularElement;
    });
  });

});
