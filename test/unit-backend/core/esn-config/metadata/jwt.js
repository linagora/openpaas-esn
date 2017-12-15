'use strict';

const expect = require('chai').expect;

describe('The core/esn-config/metadata/jwt module', () => {
  let getModule;

  beforeEach(function() {
    getModule = () => this.helpers.requireBackend('core/esn-config/metadata/jwt');
  });

  describe('The validator fn', () => {
    let validator, config;

    beforeEach(function() {
      validator = getModule().validator;
      config = {
        algorithm: 'anAlgorithm',
        publicKey: 'a public key',
        privateKey: 'a private key'
      };
    });

    it('should return error message when config is not an object', () => {
      config = [];

      expect(validator(config)).to.equal('should be object');
    });

    it('should return error message when there is no algorithm property', () => {
      delete config.algorithm;

      expect(validator(config)).to.equal('should have required property \'algorithm\'');
    });

    it('should return error message when there is no publicKey property', () => {
      delete config.publicKey;

      expect(validator(config)).to.equal('should have required property \'publicKey\'');
    });

    it('should return error message when there is no privateKey property', () => {
      delete config.privateKey;

      expect(validator(config)).to.equal('should have required property \'privateKey\'');
    });

    it('should return error message when algorithm is not a string', () => {
      config.algorithm = { algor: 'rsa256' };

      expect(validator(config)).to.equal('.algorithm: should be string');
    });

    it('should return error message when publicKey is not a string', () => {
      config.publicKey = { pkey: 'foobas' };

      expect(validator(config)).to.equal('.publicKey: should be string');
    });

    it('should return error message when privateKey is not a string', () => {
      config.privateKey = { pkey: 'foobaz' };

      expect(validator(config)).to.equal('.privateKey: should be string');
    });
  });
});
