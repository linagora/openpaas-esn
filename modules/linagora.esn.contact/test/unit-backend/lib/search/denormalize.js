'use strict';

var expect = require('chai').expect;

describe('The contact denormalize module', function() {

  var contact;

  beforeEach(function() {
    contact = {
      vcard: ['vcard', [
        ['version', {}, 'text', '4.0'],
        ['uid', {}, 'text', '3c6d4032-fce2-485b-b708-3d8d9ba280da'],
        ['fn', {}, 'text', 'Bruce Willis'],
        ['n', {}, 'text', ['Willis', 'Bruce']],
        ['org', {}, 'text', 'Master of the world'],
        ['url', {type: 'Work'}, 'text', 'http://brucewillis.io'],
        ['socialprofile', {type: 'Twitter'}, 'text', '@brucewillis'],
        ['socialprofile', {type: 'Facebook'}, 'text', 'http://facebook.com/brucewillis'],
        ['nickname', {}, 'text', 'Bruno'],
        ['role', {}, 'text', 'Expert'],
        ['categories', {}, 'Hero', 'Die Hard', 'Bald', 'Armaggedon', 'America savior'],
        ['note', {}, 'text', 'Lorep ipsum alea jacta est erare humanum est persevere diabolicum id est fluctuact nec mergitur consegur romani rosare nec plus utlra sine qua non'],
        ['bday', {}, 'date', '2015-09-09'],
        ['email', {type: 'Home'}, 'text', 'mailto:me@home.com'],
        ['email', {type: 'Office'}, 'text', 'mailto:me@work.com'],
        ['adr', {type: 'Home'}, 'text', ['', '', '123 Main Street', 'Any Town', 'CA', '91921-1234', 'U.S.A.']],
        ['tel', { type: 'Home' }, 'uri', 'tel:0567845673'],
        ['tel', { type: 'Mobile' }, 'uri', 'tel:0675787932']
      ]
      ]
    };
  });

  function denormalize() {
    return require('../../../../backend/lib/search/denormalize')(contact);
  }

  it('should return bookId and contactId', function() {
    contact.contactId = 123;
    contact.bookId = 456;
    expect(denormalize()).to.shallowDeepEqual({bookId: contact.bookId, contactId: contact.contactId});
  });

  it('should not fail when vcard is undefined', function() {
    contact.vcard = null;
    expect(denormalize()).to.deep.equal({});
  });

  it('should not fail when vcard is empty', function() {
    contact.vcard = [];
    expect(denormalize()).to.deep.equal({});
  });

  it('should not fail when vcard data is empty', function() {
    contact.vcard = [['vcard', []]];
    expect(denormalize()).to.deep.equal({});
  });

  it('should set the defined uid value', function() {
    expect(denormalize().uid).to.equal(contact.vcard[1][1][3]);
  });

  it('should set the defined fn value', function() {
    expect(denormalize().fn).to.equal(contact.vcard[1][2][3]);
  });

  it('should set the defined n value', function() {
    expect(denormalize().name).to.deep.equal(contact.vcard[1][3][3]);
  });

  it('should set the firstName', function() {
    expect(denormalize().firstName).to.equal(contact.vcard[1][3][3][1]);
  });

  it('should set the lastName', function() {
    expect(denormalize().lastName).to.equal(contact.vcard[1][3][3][0]);
  });

  it('should set the emails', function() {
    expect(denormalize().emails).to.deep.equal([{type: 'Home', value: 'me@home.com'}, {type: 'Office', value: 'me@work.com'}]);
  });

  it('should set the phone', function() {
    expect(denormalize().tel).to.deep.equal([{type: 'Home', value: '0567845673'}, {type: 'Mobile', value: '0675787932'}]);
  });

  it('should set the org', function() {
    expect(denormalize().org).to.equal(contact.vcard[1][4][3]);
  });

  it('should set the job', function() {
    expect(denormalize().job).to.equal(contact.vcard[1][9][3]);
  });

  it('should set the urls', function() {
    expect(denormalize().urls).to.deep.equal([{type: contact.vcard[1][5][1].type, value: contact.vcard[1][5][3]}]);
  });

  it('should set the tags', function() {
    expect(denormalize().tags).to.deep.equal([{'text': 'Die Hard'}, {'text': 'Bald'}, {'text': 'Armaggedon'}, {'text': 'America savior'}]);
  });

  it('should set the socialprofiles', function() {
    expect(denormalize().socialprofiles).to.deep.equal([{type: contact.vcard[1][6][1].type, value: contact.vcard[1][6][3]}, {type: contact.vcard[1][7][1].type, value: contact.vcard[1][7][3]}]);
  });

  it('should set the address', function() {
    expect(denormalize().addresses).to.deep.equal([{full: '123 Main Street Any Town CA 91921-1234 U.S.A.', type: contact.vcard[1][15][1].type, city: contact.vcard[1][15][3][3], country: contact.vcard[1][15][3][6], street: contact.vcard[1][15][3][2], zip: contact.vcard[1][15][3][5]}]);
  });

  it('should set the birthday', function() {
    expect(denormalize().birthday).to.deep.equal(new Date(2015, 8, 9, 0, 0, 0));
  });

  it('should set the nickname', function() {
    expect(denormalize().nickname).to.equal(contact.vcard[1][8][3]);
  });

  it('should set the comments', function() {
    expect(denormalize().comments).to.equal(contact.vcard[1][11][3]);
  });
});
