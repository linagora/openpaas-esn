'use strict';

/* global chai */

var expect = chai.expect;

describe('The ContactsHelper service', function() {
  var ContactsHelper, contactAddressbookDisplayService, esnDatetimeService;

  beforeEach(module('linagora.esn.contact'));

  beforeEach(angular.mock.inject(function(
    _esnDatetimeService_,
    _ContactsHelper_,
    _contactAddressbookDisplayService_
  ) {
    esnDatetimeService = _esnDatetimeService_;
    ContactsHelper = _ContactsHelper_;
    contactAddressbookDisplayService = _contactAddressbookDisplayService_;
    contactAddressbookDisplayService.convertShellToDisplayShell = angular.noop;

    esnDatetimeService.formatMediumDate = function(date) {
      return date;
    };
  }));

  describe('The fillScopeContactData function', function() {

    it('should not modify scope when contact is undefined', function() {
      var scope = {};

      ContactsHelper.fillScopeContactData(scope);
      expect(scope).to.deep.equal({});
    });

    it('should fill the scope with the contact', function() {
      var scope = {};
      var contact = {emails: [{type: 'work', value: 'me@work.com'}, {type: 'home', value: 'me@home.com'}]};

      ContactsHelper.fillScopeContactData(scope, contact);
      expect(scope.contact).to.deep.equal(contact);
    });

    it('should fill the scope with the contact emails', function() {
      var scope = {};
      var contact = {emails: [{type: 'work', value: 'me@work.com'}, {type: 'home', value: 'me@home.com'}]};

      ContactsHelper.fillScopeContactData(scope, contact);
      expect(scope.emails.length).to.equal(2);
    });

    it('should fill the scope with the contact phones', function() {
      var scope = {};
      var contact = {tel: [{type: 'work', value: '+33333333'}, {type: 'home', value: '+33444444'}]};

      ContactsHelper.fillScopeContactData(scope, contact);
      expect(scope.phones.length).to.equal(2);
    });

    it('should fill the scope with the contact formattedBirthday', function() {
      var scope = {};
      var contact = {birthday: '123', tel: [{type: 'work', value: '+33333333'}, {type: 'home', value: '+33444444'}]};

      ContactsHelper.fillScopeContactData(scope, contact);
      expect(scope.formattedBirthday).to.be.defined;
    });
  });

  describe('The orderData function', function() {

    it('should return when contact is not defined', function() {
      expect(ContactsHelper.orderData()).to.not.be.defined;
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

      ContactsHelper.orderData(contact);
      expect(contact).to.deep.equal({
        emails: [workEmail, homeEmail],
        tel: [workPhone, homePhone, otherPhone]
      });
    });
  });

  describe('The getOrderedValues function', function() {
    it('should return empty array when input is undefined', function() {
      expect(ContactsHelper.getOrderedValues()).to.deep.equal([]);
    });

    it('should return empty array when input is input array', function() {
      expect(ContactsHelper.getOrderedValues([])).to.deep.equal([]);
    });

    it('should return ordered elements based on given priority', function() {
      var a = {type: 'a', value: 1};
      var b = {type: 'b', value: 2};
      var c = {type: 'c', value: 3};

      expect(ContactsHelper.getOrderedValues([a, b, c], ['b', 'c', 'a'])).to.deep.equal([b, c, a]);
    });

    it('should return input when priorities are not defined', function() {
      var a = {type: 'a', value: 1};
      var b = {type: 'b', value: 2};
      var c = {type: 'c', value: 3};

      expect(ContactsHelper.getOrderedValues([a, b, c])).to.deep.equal([a, b, c]);
    });

    it('should return input when priorities are empty', function() {
      var a = {type: 'a', value: 1};
      var b = {type: 'b', value: 2};
      var c = {type: 'c', value: 3};

      expect(ContactsHelper.getOrderedValues([a, b, c], [])).to.deep.equal([a, b, c]);
    });

    it('should return only element with given priorities', function() {
      var a = {type: 'a', value: 1};
      var b = {type: 'b', value: 2};
      var c = {type: 'c', value: 3};
      var d = {type: 'd', value: 4};
      var e = {type: 'e', value: 5};

      expect(ContactsHelper.getOrderedValues([a, b, c, d, e], ['c', 'b', 'a'])).to.deep.equal([c, b, a]);
    });

    it('should return ordered elements based on given priority even when same types appears several times', function() {
      var a = {type: 'a', value: 1};
      var b = {type: 'b', value: 2};
      var c = {type: 'c', value: 3};
      var d = {type: 'd', value: 4};
      var e = {type: 'e', value: 6};
      var aa = {type: 'a', value: 5};
      var bb = {type: 'b', value: 7};

      expect(ContactsHelper.getOrderedValues([a, b, c, d, e, aa, bb], ['a', 'b'])).to.deep.equal([a, aa, b, bb]);
    });

  });

  describe('The getFormattedAddress function', function() {

    beforeEach(function() {
      this.expectEqual = function(value) {
        expect(ContactsHelper.getFormattedAddress(this.address)).to.equal(value);
      };
    });

    it('should return empty string when address is undefined', function() {
      expect(ContactsHelper.getFormattedAddress(this.address)).to.equal('');
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
        expect(ContactsHelper.getFormattedName(this.shell)).to.equal(value);
      };

      this.expectUndefined = function() {
        expect(ContactsHelper.getFormattedName(this.shell)).to.be.undefined;
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
      var birthday = new Date(1942, 0, 1);

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
        birthday: birthday,
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
      this.expectEqual(birthday);

      this.shell.birthday = '';
      this.expectEqual('My street My city My zip My country');
    });
  });

  describe('The getOrderType fn', function() {

    it('should return an array not containing Other object', function() {
      var scope = {};
      var results = 'Other';

      ContactsHelper.getOrderType(scope);
      expect(results).to.not.equals(scope.socialTypeOrder);
    });

  });
});
