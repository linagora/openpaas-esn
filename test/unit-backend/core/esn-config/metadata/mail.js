'use strict';

const expect = require('chai').expect;

describe('The core/esn-config/metadata/mail module', () => {
  let getModule;

  beforeEach(function() {
    getModule = () => this.helpers.requireBackend('core/esn-config/metadata/mail');
  });

  describe('The validator fn', () => {
    let validator, config, gmailConfig, localConfig, smtpConfig;

    beforeEach(function() {
      validator = getModule().validator;
      config = {
        mail: {
          noreply: 'noreply@open-paas.org',
          feedback: 'noreply@open-paas.org'
        },
        transport: smtpConfig
      };
      gmailConfig = {
          config: {
            service: 'gmail',
            auth: {
              user: 'foobar',
              pass: 'foobas'
            }
          }
      };
      localConfig = {
        module: 'foobar',
        config: {
          dir: 'foobar',
          browser: true
        }
      };
      smtpConfig = {
        config: {
          host: 'foob',
          secure: false,
          tls: {
            rejectUnauthorized: false
          },
          port: 144,
          auth: {
            user: 'foob',
            pass: 'bab'
          }
        }
      };
    });

    it('should return error if config is not an object', () => {
      expect(validator([])).to.equal('should be object');
    });

    describe('mail property', () => {
      it('should return error if mail is not an object', () => {
        config.mail = [];

        expect(validator(config)).to.equal('.mail: should be object');
      });

      it('should return error if there is no noreply proprty', () => {
        delete config.mail.noreply;

        expect(validator(config)).to.equal('.mail: should have required property \'noreply\'');
      });

      it('should return error if there is no feedback proprty', () => {
        delete config.mail.feedback;

        expect(validator(config)).to.equal('.mail: should have required property \'feedback\'');
      });

      it('should return error if feedback is not an email', () => {
        config.mail.feedback = 'not an email';

        expect(validator(config)).to.equal('.mail.feedback: should match format "email"');
      });

      it('should return error if noreply is not an email', () => {
        config.mail.noreply = 'not an email';

        expect(validator(config)).to.equal('.mail.noreply: should match format "email"');
      });
    });

    describe('transport property', () => {
      it('should return error if there is no transport property', () => {
        delete config.transport;

        expect(validator(config)).to.equal('should have required property \'transport\'');
      });

      it('should return error if transport is not an object', () => {
        config.transport = [];

        expect(validator(config)).to.equal('.transport: should be object');
      });

      describe('gmail transport', () => {
        beforeEach(() => {
          config.transport = gmailConfig;
        });

        it('should return error if there is no config property', () => {
          delete config.transport.config;

          expect(validator(config)).to.equal('.transport: should have required property \'.config\'');
        });

        it('should return error if service property is not gmail', () => {
          config.transport.config.service = 'invalid';

          expect(validator(config)).to.equal('.config.service: should be equal to one of the allowed values');
        });

        it('should return error if there is no auth property', () => {
          delete config.transport.config.auth;

          expect(validator(config)).to.equal('.config: should have required property \'auth\'');
        });

        it('should return error if there is no auth.user property', () => {
          delete config.transport.config.auth.user;

          expect(validator(config)).to.equal('.config.auth: should have required property \'user\'');
        });

        it('should return error if there is no auth.pass property', () => {
          delete config.transport.config.auth.pass;

          expect(validator(config)).to.equal('.config.auth: should have required property \'pass\'');
        });

        it('should return error if there is auth.user not a non-empty string', () => {
          config.transport.config.auth.user = {};

          expect(validator(config)).to.equal('.config.auth.user: should be string');

          config.transport.config.auth.user = '';

          expect(validator(config)).to.equal('.config.auth.user: should NOT be shorter than 1 characters');
        });

        it('should return error if there is auth.user not a non-empty string', () => {
          config.transport.config.auth.user = {};

          expect(validator(config)).to.equal('.config.auth.user: should be string');

          config.transport.config.auth.user = '';

          expect(validator(config)).to.equal('.config.auth.user: should NOT be shorter than 1 characters');
        });
      });

      describe('local transport', () => {
        beforeEach(() => {
          config.transport = localConfig;
        });

        it('should return error if module is not a non empty string', () => {
          config.transport.module = {};

          expect(validator(config)).to.equal('.module: should be string');

          config.transport.module = '';

          expect(validator(config)).to.equal('.module: should NOT be shorter than 1 characters');
        });

        it('should return error if there is no config.dir property', () => {
          delete config.transport.config.dir;

          expect(validator(config)).to.equal('.config: should have required property \'dir\'');
        });

        it('should return error if there is no config.browser property', () => {
          delete config.transport.config.browser;

          expect(validator(config)).to.equal('.config: should have required property \'browser\'');
        });

        it('should return error if config.dir is not a non-empty string', () => {
          config.transport.config.dir = {};

          expect(validator(config)).to.equal('.config.dir: should be string');

          config.transport.config.dir = '';

          expect(validator(config)).to.equal('.config.dir: should NOT be shorter than 1 characters');
        });

        it('should return error if config.browser is not boolean', () => {
          config.transport.config.browser = {};

          expect(validator(config)).to.equal('.config.browser: should be boolean');
        });
      });

      describe('smtp transport', () => {
        it('should return error if config.host is not a nonempty string', () => {
          config.transport.config.host = {};

          expect(validator(config)).to.equal('.config.host: should be string');

          config.transport.config.host = '';

          expect(validator(config)).to.equal('.config.host: should NOT be shorter than 1 characters');
        });

        it('should return error if config.secure is not boolean', () => {
          config.transport.config.secure = {};

          expect(validator(config)).to.equal('.config.secure: should be boolean');
        });

        it('should return error if config.port is not integer', () => {
          config.transport.config.port = '123';

          expect(validator(config)).to.equal('.config.port: should be integer');
        });

        it('should return error if there is no config.host property', () => {
          delete config.transport.config.host;

          expect(validator(config)).to.equal('.config: should have required property \'host\'');
        });

        it('should return error if there is no config.secure property', () => {
          delete config.transport.config.secure;

          expect(validator(config)).to.equal('.config: should have required property \'secure\'');
        });

        it('should return error if there is no config.port property', () => {
          delete config.transport.config.port;

          expect(validator(config)).to.equal('.config: should have required property \'port\'');
        });

        describe('tls property', () => {
          it('should return error if there is no tls property', () => {
            config.transport.config.tls = undefined;

            expect(validator(config)).to.equal('.config: should have required property \'tls\'');
          });

          it('should return error if there is no tls.rejectUnauthorized property', () => {
            config.transport.config.tls.rejectUnauthorized = undefined;

            expect(validator(config)).to.equal('.config.tls: should have required property \'rejectUnauthorized\'');
          });

          it('should return error if there is no tls.rejectUnauthorized property', () => {
            config.transport.config.tls.rejectUnauthorized = undefined;

            expect(validator(config)).to.equal('.config.tls: should have required property \'rejectUnauthorized\'');
          });

          it('should return error if tls.rejectUnauthorized is not boolean', () => {
            config.transport.config.tls.rejectUnauthorized = 'undefined';

            expect(validator(config)).to.equal('.config.tls.rejectUnauthorized: should be boolean');
          });
        });

        describe('auth property', () => {
          it('should return error if there is auth.user not a non-empty string', () => {
            config.transport.config.auth.user = {};

            expect(validator(config)).to.equal('.config.auth.user: should be string');
          });

          it('should return error if there is auth.user not a non-empty string', () => {
            config.transport.config.auth.user = {};

            expect(validator(config)).to.equal('.config.auth.user: should be string');
          });
        });
      });
    });
  });
});
