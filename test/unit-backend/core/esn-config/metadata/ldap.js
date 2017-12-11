'use strict';

const expect = require('chai').expect;

describe('The core/esn-config/metadata/ldap module', () => {
  let getModule;

  beforeEach(function() {
    getModule = () => this.helpers.requireBackend('core/esn-config/metadata/ldap');
  });

  describe('The validator fn', () => {
    let validator, config;

    beforeEach(function() {
      validator = getModule().validator;
      config = [{
        configuration: {
          mapping: {
            lastname: 'last_name',
            firstname: 'first_name'
          },
          url: 'foo',
          adminDn: 'bar',
          adminPassword: 'foo',
          searchBase: 'bas',
          searchFilter: '(foo={{username}})'
        },
        usage: {
          auth: false,
          search: false
        },
        name: 'ldap'
      }];
    });

    it('should return error message when config is not a non-empty array', () => {
      expect(validator({})).to.equal('should be array');
      expect(validator([])).to.equal('should NOT have less than 1 items');
    });

    describe('config item', () => {
      it('should return error message when there is no configuration property', () => {
        delete config[0].configuration;

        expect(validator(config)).to.equal('[0]: should have required property \'configuration\'');
      });

      it('should return error message when there is no usage property', () => {
        delete config[0].usage;

        expect(validator(config)).to.equal('[0]: should have required property \'usage\'');
      });

      it('should return error message when there is no name property', () => {
        delete config[0].name;

        expect(validator(config)).to.equal('[0]: should have required property \'name\'');
      });

      it('should return error message when name proprty is not a string', () => {
        config[0].name = {};

        expect(validator(config)).to.equal('[0].name: should be string');
      });

      describe('configuration property', () => {
        it('should return error message when adminDn is not a string', () => {
          config[0].configuration.adminDn = 123;

          expect(validator(config)).to.equal('[0].configuration.adminDn: should be string');
        });

        it('should return error message when url is not a string', () => {
          config[0].configuration.url = 123;

          expect(validator(config)).to.equal('[0].configuration.url: should be string');
        });

        it('should return error message when searchBase is not a string', () => {
          config[0].configuration.searchBase = 123;

          expect(validator(config)).to.equal('[0].configuration.searchBase: should be string');
        });

        it('should return error message when searchFilter is not a string', () => {
          config[0].configuration.searchFilter = 123;

          expect(validator(config)).to.equal('[0].configuration.searchFilter: should be string');
        });

        it('should return error message when adminPassword is not a string', () => {
          config[0].configuration.adminPassword = 123;

          expect(validator(config)).to.equal('[0].configuration.adminPassword: should be string');
        });

        it('should return error message when there is no url', () => {
          delete config[0].configuration.url;

          expect(validator(config)).to.equal('[0].configuration: should have required property \'url\'');
        });

        it('should return error message when there is no searchBase', () => {
          delete config[0].configuration.searchBase;

          expect(validator(config)).to.equal('[0].configuration: should have required property \'searchBase\'');
        });

        it('should return error message when there is no searchFilter', () => {
          delete config[0].configuration.searchFilter;

          expect(validator(config)).to.equal('[0].configuration: should have required property \'searchFilter\'');
        });
      });

      describe('usage property', () => {
        it('should return error message when it is not an object', () => {
          config[0].usage = [];

          expect(validator(config)).to.equal('[0].usage: should be object');
        });

        it('should return error message when auth is not boolean', () => {
          config[0].usage.auth = 'true';

          expect(validator(config)).to.equal('[0].usage.auth: should be boolean');
        });

        it('should return error message when search is not boolean', () => {
          config[0].usage.search = 'false';

          expect(validator(config)).to.equal('[0].usage.search: should be boolean');
        });
      });
    });
  });
});
