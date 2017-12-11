'use strict';

const expect = require('chai').expect;

describe('The core/esn-config/metadata/autoconf module', () => {
  let getModule, config;

  beforeEach(function() {
    getModule = () => this.helpers.requireBackend('core/esn-config/metadata/autoconf');

  });

  describe('The validator fn', () => {
    let validator;

    beforeEach(function() {
      validator = getModule().validator;
      config = {
        directories: [{
          maxHits: 50,
          uri: 'ldapUrl',
          dirName: 'OpenPaas'
        }],
        preferences: [{
          overwrite: true,
          value: false,
          name: 'app.update.enabled'
        }, {
          overwrite: true,
          value: true,
          name: 'extensions.update.enabled'
        }, {
          value: false,
          name: 'extensions.cardbook.firstOpen'
        }, {
          value: false,
          name: 'extensions.cardbook.exclusive'
        }, {
          value: false,
          name: 'extensions.cardbook.firstRun'
        }],
        addons: [{
          versions: [{
            platforms: [{
              account: true,
              url: 'https://addons.mozilla.org/thunderbird/downloads/file/430153/lightning-4.7-sm+tb-linux.xpi',
              platform: 'Linux'
            }],
            minAppVersion: '45',
            version: '4.7'
          }],
          name: 'Lightning',
          id: '{e2fda1a4-762b-4020-b5ad-a41df1933103}'
        }, {
          versions: [{
            version: '16.7'
          }],
          name: 'CardBook',
          id: 'cardbook@vigneau.philippe'
        }],
        accounts: [{
          imap: {
            prettyName: 'OpenPaas (<%= user.preferredEmail %>)',
            hostName: 'openpaas.linagora.com',
            username: '<%= user.preferredEmail %>',
            port: 143,
            socketType: '2'
          },
          smtp: {
            description: 'OpenPaas SMTP (<%= user.preferredEmail %>)',
            hostname: 'smtp.linagora.com',
            username: '<%= user.preferredEmail %>',
            port: 587,
            socketType: '2'
          },
          identities: [{
            identityName: 'Default (<%= user.preferredEmail %>)',
            email: '<%= user.preferredEmail %>',
            fullName: '<%= user.firstname %> <%= user.lastname %>',
            organization: '',
            autoQuote: true,
            replyOnTop: '1',
            sigBottom: false,
            sigOnForward: true,
            sigOnReply: true,
            attachSignature: false,
            htmlSigText: '',
            htmlSigFormat: true,
            fccFolder: '%serverURI%/Sent',
            draftFolder: '%serverURI%/Drafts'
          }]
        }]
      };
    });

    it('should return error message message when config is not an object', () => {
      const config = [];

      expect(validator(config)).to.equal('should be object');
    });

    it('should return error message if there is no directories properties', () => {
      delete config.directories;

      expect(validator(config)).to.equal('should have required property \'directories\'');
    });

    it('should return error message if there is no preferences properties', () => {
      delete config.preferences;

      expect(validator(config)).to.equal('should have required property \'preferences\'');
    });

    it('should return error message if there is no addons properties', () => {
      delete config.addons;

      expect(validator(config)).to.equal('should have required property \'addons\'');
    });

    it('should return error message if there is no accounts properties', () => {
      delete config.accounts;

      expect(validator(config)).to.equal('should have required property \'accounts\'');
    });

    describe('directories property', () => {
      it('return error if directories is not a non-empty array', () => {
        config.directories = {};

        expect(validator(config)).to.equal('.directories: should be array');

        config.directories = [];

        expect(validator(config)).to.equal('.directories: should NOT have less than 1 items');
      });

      describe('directories items', () => {
        it('should return error message if there is no maxHits property', () => {
          delete config.directories[0].maxHits;

          expect(validator(config)).to.equal('.directories[0]: should have required property \'maxHits\'');
        });

        it('should return error message if there is no uri property', () => {
          delete config.directories[0].uri;

          expect(validator(config)).to.equal('.directories[0]: should have required property \'uri\'');
        });

        it('should return error message if there is no dirName property', () => {
          delete config.directories[0].dirName;

          expect(validator(config)).to.equal('.directories[0]: should have required property \'dirName\'');
        });

        it('should return error message if directories.maxHits is not a number', () => {
          config.directories[0].maxHits = '123';

          expect(validator(config)).to.equal('.directories[0].maxHits: should be integer');
        });

        it('should return error message if directories.uri is not a string', () => {
          config.directories[0].uri = {};

          expect(validator(config)).to.equal('.directories[0].uri: should be string');
        });

        it('should return error message if directories.uri length is less than 1', () => {
          config.directories[0].uri = '';

          expect(validator(config)).to.equal('.directories[0].uri: should NOT be shorter than 1 characters');
        });

        it('should return error message if directories.dirName is not a string', () => {
          config.directories[0].dirName = {};

          expect(validator(config)).to.equal('.directories[0].dirName: should be string');
        });

        it('should return error message if directories.dirName length is less than 1', () => {
          config.directories[0].dirName = '';

          expect(validator(config)).to.equal('.directories[0].dirName: should NOT be shorter than 1 characters');
        });
      });
    });

    describe('preferences property', () => {
      it('should return error message if preferences is not array', () => {
        config.preferences = {};

        expect(validator(config)).to.equal('.preferences: should be array');
      });

      it('should have at least 1 item', () => {
        config.preferences = [];

        expect(validator(config)).to.equal('.preferences: should NOT have less than 1 items');
      });

      describe('preferences item', () => {
        it('should return error message if there is no value', () => {
          delete config.preferences[0].value;

          expect(validator(config)).to.equal('.preferences[0]: should have required property \'value\'');
        });

        it('should return error message if there is no name', () => {
          delete config.preferences[0].name;

          expect(validator(config)).to.equal('.preferences[0]: should have required property \'name\'');
        });

        it('should return error message if value is not boolean', () => {
          config.preferences[0].value = 'true';

          expect(validator(config)).to.equal('.preferences[0].value: should be boolean');
        });

        it('should return error message if name is not one of valid preferences', () => {
          config.preferences[0].name = 'invalid';

          expect(validator(config)).to.equal('.preferences[0].name: should be equal to one of the allowed values');
        });
      });
    });

    describe('addons property', () => {
      it('should return error message if addons is not array', () => {
        config.addons = {};

        expect(validator(config)).to.equal('.addons: should be array');
      });

      it('should have at least 1 item', () => {
        config.addons = [];

        expect(validator(config)).to.equal('.addons: should NOT have less than 1 items');
      });

      describe('addons item', () => {
        it('should return error message if there is no name', () => {
          delete config.addons[0].name;

          expect(validator(config)).to.equal('.addons[0]: should have required property \'name\'');
        });

        it('should return error message if there is no id', () => {
          delete config.addons[0].id;

          expect(validator(config)).to.equal('.addons[0]: should have required property \'id\'');
        });

        describe('versions property', () => {
          it('should return error message if versions is not array', () => {
            config.addons[0].versions = {};

            expect(validator(config)).to.equal('.addons[0].versions: should be array');
          });

          it('should return error message if there is no version in array', () => {
            config.addons[0].versions = [];

            expect(validator(config)).to.equal('.addons[0].versions: should NOT have less than 1 items');
          });

          it('should return error message if version is not a tring', () => {
            config.addons[0].versions[0].version = 50;

            expect(validator(config)).to.equal('.addons[0].versions[0].version: should be string');
          });

          it('should return error message if minAppVersion is not a string', () => {
            config.addons[0].versions[0].minAppVersion = 50;

            expect(validator(config)).to.equal('.addons[0].versions[0].minAppVersion: should be string');
          });

          describe('platforms property', () => {
            it('should return error message if platforms is not array', () => {
              config.addons[0].versions[0].platforms = 50;

              expect(validator(config)).to.equal('.addons[0].versions[0].platforms: should be array');
            });

            it('should return error message if platforms is empty', () => {
              config.addons[0].versions[0].platforms = [];

              expect(validator(config)).to.equal('.addons[0].versions[0].platforms: should NOT have less than 1 items');
            });

            it('should return error message if account is not boolean', () => {
              config.addons[0].versions[0].platforms[0].account = 'false';

              expect(validator(config)).to.equal('.addons[0].versions[0].platforms[0].account: should be boolean');
            });

            it('should return error message if there is no url', () => {
              delete config.addons[0].versions[0].platforms[0].url;

              expect(validator(config)).to.equal('.addons[0].versions[0].platforms[0]: should have required property \'url\'');
            });

            it('should return error message if url is not a string', () => {
              config.addons[0].versions[0].platforms[0].url = {};

              expect(validator(config)).to.equal('.addons[0].versions[0].platforms[0].url: should be string');
            });

            it('should return error message if platform is not a string', () => {
              config.addons[0].versions[0].platforms[0].account = {};

              expect(validator(config)).to.equal('.addons[0].versions[0].platforms[0].account: should be boolean');
            });
          });
        });
      });
    });

    describe('accounts property', () => {
      it('should return error message if accounts is not array', () => {
        config.accounts = {};

        expect(validator(config)).to.equal('.accounts: should be array');
      });

      describe('accounts item', () => {
        it('should return error message if there is no imap property', () => {
          delete config.accounts[0].imap;

          expect(validator(config)).to.equal('.accounts[0]: should have required property \'imap\'');
        });

        it('should return error message if there is no smtp property', () => {
          delete config.accounts[0].smtp;

          expect(validator(config)).to.equal('.accounts[0]: should have required property \'smtp\'');
        });

        it('should return error message if there is no identities property', () => {
          delete config.accounts[0].identities;

          expect(validator(config)).to.equal('.accounts[0]: should have required property \'identities\'');
        });

        describe('imap property', () => {
          it('should return error message if prettyName is not correct string format', () => {
            config.accounts[0].imap.prettyName = 'invalid';

            expect(validator(config)).to.equal('.accounts[0].imap.prettyName: should be equal to one of the allowed values');
          });

          it('should return error message if username is not correct string format', () => {
            config.accounts[0].imap.username = 'invalid';

            expect(validator(config)).to.equal('.accounts[0].imap.username: should be equal to one of the allowed values');
          });

          it('should return error message if port is not integer', () => {
            config.accounts[0].imap.port = '24';

            expect(validator(config)).to.equal('.accounts[0].imap.port: should be integer');
          });

          it('should return error message if socketType is not a string of \'1\', \'2\' or \'3\'', () => {
            config.accounts[0].imap.socketType = '4';

            expect(validator(config)).to.equal('.accounts[0].imap.socketType: should be equal to one of the allowed values');
          });

          it('should return error message if hostName is not correct string format', () => {
            config.accounts[0].imap.hostName = [];

            expect(validator(config)).to.equal('.accounts[0].imap.hostName: should be string');

            config.accounts[0].imap.hostName = '';

            expect(validator(config)).to.equal('.accounts[0].imap.hostName: should NOT be shorter than 1 characters');
          });
        });

        describe('smtp property', () => {
          it('should return error message if description is not an allowed value', () => {
            config.accounts[0].smtp.description = 'invalid';

            expect(validator(config)).to.equal('.accounts[0].smtp.description: should be equal to one of the allowed values');
          });

          it('should return error message if username is not correct string format', () => {
            config.accounts[0].smtp.username = 'invalid';

            expect(validator(config)).to.equal('.accounts[0].smtp.username: should be equal to one of the allowed values');
          });

          it('should return error message if port is not integer', () => {
            config.accounts[0].smtp.port = '24';

            expect(validator(config)).to.equal('.accounts[0].smtp.port: should be integer');
          });

          it('should return error message if socketType is not a string of \'1\', \'2\' or \'3\'', () => {
            config.accounts[0].smtp.socketType = '4';

            expect(validator(config)).to.equal('.accounts[0].smtp.socketType: should be equal to one of the allowed values');
          });

          it('should return error message if hostname is not correct string format', () => {
            config.accounts[0].smtp.hostname = [];

            expect(validator(config)).to.equal('.accounts[0].smtp.hostname: should be string');

            config.accounts[0].smtp.hostname = '';

            expect(validator(config)).to.equal('.accounts[0].smtp.hostname: should NOT be shorter than 1 characters');
          });
        });

        describe('identities property', () => {
          it('should return error message if it is not an non-empty array', () => {
            config.accounts[0].identities = {};

            expect(validator(config)).to.equal('.accounts[0].identities: should be array');

            config.accounts[0].identities = [];

            expect(validator(config)).to.equal('.accounts[0].identities: should NOT have less than 1 items');
          });

          describe('identities item', () => {
            it('should return error message if identityName is not an allowed string', () => {
              config.accounts[0].identities[0].identityName = 'invalid';

              expect(validator(config)).to.equal('.accounts[0].identities[0].identityName: should be equal to one of the allowed values');
            });

            it('should return error message if email is not an allowed string', () => {
              config.accounts[0].identities[0].email = 'invalid';

              expect(validator(config)).to.equal('.accounts[0].identities[0].email: should be equal to one of the allowed values');
            });

            it('should return error message if fullName is not an allowed string', () => {
              config.accounts[0].identities[0].fullName = 'invalid';

              expect(validator(config)).to.equal('.accounts[0].identities[0].fullName: should be equal to one of the allowed values');
            });

            it('should return error message if organization is not a string', () => {
              config.accounts[0].identities[0].organization = {};

              expect(validator(config)).to.equal('.accounts[0].identities[0].organization: should be string');
            });

            it('should return error message if autoQuote is not a boolean', () => {
              config.accounts[0].identities[0].autoQuote = 'false';

              expect(validator(config)).to.equal('.accounts[0].identities[0].autoQuote: should be boolean');
            });

            it('should return error message if replyOnTop is not a string', () => {
              config.accounts[0].identities[0].replyOnTop = [];

              expect(validator(config)).to.equal('.accounts[0].identities[0].replyOnTop: should be string');
            });

            it('should return error message if sigBottom is not a boolean', () => {
              config.accounts[0].identities[0].sigBottom = [];

              expect(validator(config)).to.equal('.accounts[0].identities[0].sigBottom: should be boolean');
            });

            it('should return error message if sigOnForward is not a boolean', () => {
              config.accounts[0].identities[0].sigOnForward = [];

              expect(validator(config)).to.equal('.accounts[0].identities[0].sigOnForward: should be boolean');
            });

            it('should return error message if sigOnReply is not a boolean', () => {
              config.accounts[0].identities[0].sigOnReply = [];

              expect(validator(config)).to.equal('.accounts[0].identities[0].sigOnReply: should be boolean');
            });

            it('should return error message if attachSignature is not a boolean', () => {
              config.accounts[0].identities[0].attachSignature = [];

              expect(validator(config)).to.equal('.accounts[0].identities[0].attachSignature: should be boolean');
            });

            it('should return error message if htmlSigText is not a string', () => {
              config.accounts[0].identities[0].htmlSigText = 123;

              expect(validator(config)).to.equal('.accounts[0].identities[0].htmlSigText: should be string');
            });

            it('should return error message if htmlSigFormat is not a string', () => {
              config.accounts[0].identities[0].htmlSigFormat = 123;

              expect(validator(config)).to.equal('.accounts[0].identities[0].htmlSigFormat: should be boolean');
            });

            it('should return error message if fccFolder is not an allowd value', () => {
              config.accounts[0].identities[0].fccFolder = '123';

              expect(validator(config)).to.equal('.accounts[0].identities[0].fccFolder: should be equal to one of the allowed values');
            });

            it('should return error message if draftFolder is not an allowd value', () => {
              config.accounts[0].identities[0].draftFolder = 'invass';

              expect(validator(config)).to.equal('.accounts[0].identities[0].draftFolder: should be equal to one of the allowed values');
            });
          });
        });
      });
    });
  });
});
