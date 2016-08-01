'use strict';

var mockery = require('mockery');
var expect = require('chai').expect;

describe('The i18n module', function() {

  it('should use the custom configuration', function() {
    mockery.registerMock('../core/config', function() {
      return {
        i18n: {
          directory: './test/unit-backend/fixtures/locales',
          defaultLocale: 'fr',
          locales: ['fr']
        }
      }
    });
    var i18nModule = this.helpers.requireBackend('i18n');
    expect(i18nModule.__('this is a message for the unit test')).to.equal('ceci est un message pour le test unitaire');
  });
});
