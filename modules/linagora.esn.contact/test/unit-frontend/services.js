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

    describe('The orderData function', function() {

      it('should return when contact is not defined', function() {
        expect(this.contactHelper.orderData()).to.not.be.defined;
      });

      it('should order emails and tel of the given contact', function() {
        var homeEmail = {type: 'Home', value: 'me@home'};
        var workEmail = {type: 'Work', value: 'me@work'};
        var homePhone = {type: 'Home', value: '+123'};
        var workPhone = {type: 'Work', value: '+456'};
        var otherPhone = {type: 'Other', value: '+789'};

        var contact = {
          emails: [homeEmail, workEmail],
          tel: [otherPhone, homePhone, workPhone]
        };
        this.contactHelper.orderData(contact);
        expect(contact).to.deep.equal({
          emails: [workEmail, homeEmail],
          tel: [workPhone, homePhone, otherPhone]
        });
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
        this.expectEqual('Jan 1, 1942');

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

    describe('The getOrderType fn', function() {

      it('should return an array not containing Other object', function() {
        var scope = {};
        var results = 'Other';
        this.contactHelper.getOrderType(scope);
        expect(results).to.not.equals(scope.socialTypeOrder);
      });

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
