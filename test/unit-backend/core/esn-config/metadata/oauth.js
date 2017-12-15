'use strict';

const expect = require('chai').expect;

describe('The core/esn-config/metadata/oauth module', () => {
  let getModule;

  beforeEach(function() {
    getModule = () => this.helpers.requireBackend('core/esn-config/metadata/oauth');
  });

  describe('The validator fn', () => {
    let validator, config;

    beforeEach(function() {
      validator = getModule().validator;
    });

    describe('facebook property', () => {
      beforeEach(() => {
        config = {
          facebook: {
            client_secret: 'foo',
            client_id: 'bar',
            usage: {
              account: false
            }
          }
        };
      });

      it('should return error if there is no client_secret', () => {
        delete config.facebook.client_secret;

        expect(validator(config)).to.equal('.facebook: should have required property \'client_secret\'');
      });

      it('should return error if there is no client_id', () => {
        delete config.facebook.client_id;

        expect(validator(config)).to.equal('.facebook: should have required property \'client_id\'');
      });

      it('should return error if client_id is not a nonempty string', () => {
        config.facebook.client_id = [];

        expect(validator(config)).to.equal('.facebook.client_id: should be string');

        config.facebook.client_id = '';

        expect(validator(config)).to.equal('.facebook.client_id: should NOT be shorter than 1 characters');
      });

      it('should return error if client_secret is not a nonempty string', () => {
        config.facebook.client_secret = [];

        expect(validator(config)).to.equal('.facebook.client_secret: should be string');

        config.facebook.client_secret = '';

        expect(validator(config)).to.equal('.facebook.client_secret: should NOT be shorter than 1 characters');
      });

      it('should return error if usage.account is undefined or not boolean', () => {
        config.facebook.usage.account = undefined;

        expect(validator(config)).to.equal('.facebook.usage: should have required property \'account\'');

        config.facebook.usage.account = 'true';

        expect(validator(config)).to.equal('.facebook.usage.account: should be boolean');
      });
    });

    describe('github property', () => {
      beforeEach(() => {
        config = {
          github: {
            client_secret: 'foo',
            client_id: 'baz',
            usage: {
              account: true
            }
          }
        };
      });

      it('should return error if there is no client_secret', () => {
        delete config.github.client_secret;

        expect(validator(config)).to.equal('.github: should have required property \'client_secret\'');
      });

      it('should return error if there is no client_id', () => {
        delete config.github.client_id;

        expect(validator(config)).to.equal('.github: should have required property \'client_id\'');
      });

      it('should return error if client_id is not a nonempty string', () => {
        config.github.client_id = [];

        expect(validator(config)).to.equal('.github.client_id: should be string');

        config.github.client_id = '';

        expect(validator(config)).to.equal('.github.client_id: should NOT be shorter than 1 characters');
      });

      it('should return error if client_secret is not a nonempty string', () => {
        config.github.client_secret = [];

        expect(validator(config)).to.equal('.github.client_secret: should be string');

        config.github.client_secret = '';

        expect(validator(config)).to.equal('.github.client_secret: should NOT be shorter than 1 characters');
      });

      it('should return error if usage.account is undefined or not boolean', () => {
        config.github.usage.account = undefined;

        expect(validator(config)).to.equal('.github.usage: should have required property \'account\'');

        config.github.usage.account = 'true';

        expect(validator(config)).to.equal('.github.usage.account: should be boolean');
      });
    });

    describe('twitter property', () => {
      beforeEach(() => {
        config = {
          twitter: {
            consumer_secret: 'foo',
            consumer_key: 'bas',
            usage: {
              account: true
            }
          }
        };
      });

      it('should return error if there is no consumer_secret', () => {
        delete config.twitter.consumer_secret;

        expect(validator(config)).to.equal('.twitter: should have required property \'consumer_secret\'');
      });

      it('should return error if there is no consumer_key', () => {
        delete config.twitter.consumer_key;

        expect(validator(config)).to.equal('.twitter: should have required property \'consumer_key\'');
      });

      it('should return error if consumer_key is not a nonempty string', () => {
        config.twitter.consumer_key = [];

        expect(validator(config)).to.equal('.twitter.consumer_key: should be string');

        config.twitter.consumer_key = '';

        expect(validator(config)).to.equal('.twitter.consumer_key: should NOT be shorter than 1 characters');
      });

      it('should return error if consumer_secret is not a nonempty string', () => {
        config.twitter.consumer_secret = [];

        expect(validator(config)).to.equal('.twitter.consumer_secret: should be string');

        config.twitter.consumer_secret = '';

        expect(validator(config)).to.equal('.twitter.consumer_secret: should NOT be shorter than 1 characters');
      });

      it('should return error if usage.account is undefined or not boolean', () => {
        config.twitter.usage.account = undefined;

        expect(validator(config)).to.equal('.twitter.usage: should have required property \'account\'');

        config.twitter.usage.account = 'true';

        expect(validator(config)).to.equal('.twitter.usage.account: should be boolean');
      });
    });

    describe('google property', () => {
      beforeEach(() => {
        config = {
          google: {
            client_secret: 'foo',
            client_id: 'baz',
            usage: {
              account: true
            }
          }
        };
      });

      it('should return error if there is no client_secret', () => {
        delete config.google.client_secret;

        expect(validator(config)).to.equal('.google: should have required property \'client_secret\'');
      });

      it('should return error if there is no client_id', () => {
        delete config.google.client_id;

        expect(validator(config)).to.equal('.google: should have required property \'client_id\'');
      });

      it('should return error if client_id is not a nonempty string', () => {
        config.google.client_id = [];

        expect(validator(config)).to.equal('.google.client_id: should be string');

        config.google.client_id = '';

        expect(validator(config)).to.equal('.google.client_id: should NOT be shorter than 1 characters');
      });

      it('should return error if client_secret is not a nonempty string', () => {
        config.google.client_secret = [];

        expect(validator(config)).to.equal('.google.client_secret: should be string');

        config.google.client_secret = '';

        expect(validator(config)).to.equal('.google.client_secret: should NOT be shorter than 1 characters');
      });

      it('should return error if usage.account is undefined or not boolean', () => {
        config.google.usage.account = undefined;

        expect(validator(config)).to.equal('.google.usage: should have required property \'account\'');

        config.google.usage.account = 'true';

        expect(validator(config)).to.equal('.google.usage.account: should be boolean');
      });
    });
  });
});
