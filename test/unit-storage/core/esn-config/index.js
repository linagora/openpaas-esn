'use strict';

const expect = require('chai').expect;
const q = require('q');
const ObjectId = require('mongoose').Types.ObjectId;

describe('The esn-config module', function() {

  var getModule;
  var saveDoc;

  before(function() {
    this.testEnv.writeDBConfigFile();
  });

  after(function() {
    this.testEnv.removeDBConfigFile();
  });

  beforeEach(function(done) {
    this.mongoose = require('mongoose');
    this.connectMongoose(this.mongoose, done);

    getModule = this.helpers.requireBackend.bind(this.helpers, 'core/esn-config');
    saveDoc = this.helpers.mongo.saveDoc.bind(this.helpers.mongo);
  });

  afterEach(function(done) {
    this.helpers.mongo.dropDatabase(done);
  });

  describe('The get fn', function() {

    it('should get config from "configurations" collection', function(done) {
      var config = {
        email: { key: 'value' }
      };
      var doc = {
        modules: [{
          name: 'core',
          configurations: [{
            name: 'mail',
            value: config
          }]
        }]
      };

      saveDoc('configurations', doc, function() {
        getModule()('mail').get().then(function(data) {
          expect(data).to.deep.equal(config);
          done();
        });
      });
    });

    it('should get config from "configuration" collection (backward compatibility)', function(done) {
      var doc = {
        _id: 'mail',
        email: { key: 'value' }
      };

      saveDoc('configuration', doc, function() {
        getModule()('mail').get().then(function(data) {
          expect(data).to.deep.equal({ email: { key: 'value' } });
          done();
        });
      });
    });

    it('should get config from "features" collection (backward compatibility)', function(done) {
      var config = {
        email: { key: 'value' }
      };
      var doc = {
        modules: [{
          name: 'core',
          features: [{
            name: 'mail',
            value: config
          }]
        }]
      };

      saveDoc('features', doc, function() {
        getModule()('mail').get().then(function(data) {
          expect(data).to.deep.equal(config);
          done();
        });
      });
    });

    it('should get config from "configurations" as top priority if it is available in both three collections (backward compatibility)', function(done) {
      var docInMongoConfig = {
        _id: 'mail',
        email: { key0: 'value0' }
      };
      var configInFeatures = {
        email: { key1: 'value1' }
      };
      var docInFeatures = {
        modules: [{
          name: 'core',
          features: [{
            name: 'mail',
            value: configInFeatures
          }]
        }]
      };
      var configInConfigurations = {
        email: { key2: 'value2' }
      };
      var docInConfigurations = {
        modules: [{
          name: 'core',
          configurations: [{
            name: 'mail',
            value: configInConfigurations
          }]
        }]
      };

      q.all([
        q.nfcall(saveDoc, 'configuration', docInMongoConfig),
        q.nfcall(saveDoc, 'features', docInFeatures),
        q.nfcall(saveDoc, 'configurations', docInConfigurations)
      ])
      .then(function() {
        getModule()('mail').get().then(function(data) {
          expect(data).to.deep.equal(configInConfigurations);
          done();
        });
      });
    });

    it('should get user config from "configurations" as top priority if userId param is defined (backward compatibility)', function(done) {
      const user = {_id: new ObjectId()};
      const isUserWide = true;
      const docInMongoConfig = {
        _id: 'mail',
        email: { key0: 'value0' }
      };
      const configInFeatures = {
        email: { key1: 'value1' }
      };
      const docInFeatures = {
        modules: [{
          name: 'core',
          features: [{
            name: 'mail',
            value: configInFeatures
          }]
        }]
      };
      const configInConfigurations = {
        email: { key2: 'value2' }
      };
      const docInConfigurations = {
        modules: [{
          name: 'core',
          configurations: [{
            name: 'mail',
            value: configInConfigurations
          }]
        }]
      };

      const userConfigInConfigurations = {
        email: { key2: 'value3' }
      };
      const userDocInConfigurations = {
        user_id: user._id,
        modules: [{
          name: 'core',
          configurations: [{
            name: 'mail',
            value: userConfigInConfigurations
          }]
        }]
      };

      q.all([
        q.nfcall(saveDoc, 'configuration', docInMongoConfig),
        q.nfcall(saveDoc, 'features', docInFeatures),
        q.nfcall(saveDoc, 'configurations', docInConfigurations),
        q.nfcall(saveDoc, 'configurations', userDocInConfigurations)
      ])
      .then(function() {
        getModule()('mail').forUser(user, isUserWide).get().then(function(data) {
          expect(data).to.deep.equal(userConfigInConfigurations);
          done();
        });
      });
    });

    it('should get config from "features" as top priority if it is available in only "features" and "configuration" collections (backward compatibility)', function(done) {
      var docInMongoConfig = {
        _id: 'mail',
        email: { key0: 'value0' }
      };
      var configInFeatures = {
        email: { key1: 'value1' }
      };
      var docInFeatures = {
        modules: [{
          name: 'core',
          features: [{
            name: 'mail',
            value: configInFeatures
          }]
        }]
      };

      q.all([
        q.nfcall(saveDoc, 'configuration', docInMongoConfig),
        q.nfcall(saveDoc, 'features', docInFeatures)
      ])
      .then(function() {
        getModule()('mail').get().then(function(data) {
          expect(data).to.deep.equal(configInFeatures);
          done();
        });
      });
    });

    it('should be able to get domain-wide config', function(done) {
      var configWithoutDomain = {
        email: { key1: 'value1' }
      };
      var docWithoutDomain = {
        modules: [{
          name: 'core',
          configurations: [{
            name: 'mail',
            value: configWithoutDomain
          }]
        }]
      };

      var domainId = new ObjectId();
      var configWithDomain = {
        email: { key2: 'value2' }
      };
      var docWithDomain = {
        domain_id: domainId,
        modules: [{
          name: 'core',
          configurations: [{
            name: 'mail',
            value: configWithDomain
          }]
        }]
      };

      q.all([
        q.nfcall(saveDoc, 'configurations', docWithoutDomain),
        q.nfcall(saveDoc, 'configurations', docWithDomain)
      ])
      .then(function() {
        getModule()('mail')
          .forUser({ preferredDomainId: domainId })
          .get()
          .then(function(mailConfig) {
            expect(mailConfig).to.deep.equal(configWithDomain);
            done();
          })
          .catch(done.bind(null, 'should resolve'));
      });
    });

    it('should fallback to system-wide config when domain-wide config is not available', function(done) {
      var configWithoutDomain = {
        email: { key1: 'value1' }
      };
      var docWithoutDomain = {
        modules: [{
          name: 'core',
          configurations: [{
            name: 'mail',
            value: configWithoutDomain
          }]
        }]
      };

      var domainId = new ObjectId();
      var configWithDomain = {
        email: { key2: 'value2' }
      };
      var docWithDomain = {
        domain_id: domainId,
        modules: [{
          name: 'core',
          configurations: [{
            name: 'not-mail',
            value: configWithDomain
          }]
        }]
      };

      q.all([
        q.nfcall(saveDoc, 'configurations', docWithoutDomain),
        q.nfcall(saveDoc, 'configurations', docWithDomain)
      ])
      .then(function() {
        getModule()('mail')
          .forUser({ preferredDomainId: domainId })
          .get()
          .then(function(mailConfig) {
            expect(mailConfig).to.deep.equal(configWithoutDomain);
            done();
          })
          .catch(done.bind(null, 'should resolve'));
      });
    });

  });

  describe('The getFromAllDomains fn', function() {

    it('should get configs from all domain, including system-wide config', function(done) {
      var configWithoutDomain = {
        email: { key0: 'value0' }
      };
      var docWithoutDomain = {
        modules: [{
          name: 'core',
          configurations: [{
            name: 'mail',
            value: configWithoutDomain
          }]
        }]
      };
      var domainId1 = new ObjectId();
      var configWithDomain1 = {
        email: { key1: 'value1' }
      };
      var docWithDomain1 = {
        domain_id: domainId1,
        modules: [{
          name: 'core',
          configurations: [{
            name: 'mail',
            value: configWithDomain1
          }]
        }]
      };

      var domainId2 = new ObjectId();
      var configWithDomain2 = {
        email: { key2: 'value2' }
      };
      var docWithDomain2 = {
        domain_id: domainId2,
        modules: [{
          name: 'core',
          configurations: [{
            name: 'mail',
            value: configWithDomain2
          }]
        }]
      };

      q.all([
        q.nfcall(saveDoc, 'configurations', docWithoutDomain),
        q.nfcall(saveDoc, 'configurations', docWithDomain1),
        q.nfcall(saveDoc, 'configurations', docWithDomain2)
      ])
      .then(function() {
        getModule()('mail')
          .getFromAllDomains()
          .then(function(configs) {
            expect(configs).to.have.length(3);
            done();
          }, done.bind(null, 'should resolve'));
      });
    });

    it('should try to get any possible configuration when nothing found from "configurations" collection', function(done) {
      var docInMongoConfig = {
        _id: 'mail',
        email: { key0: 'value0' }
      };
      var configInFeatures = {
        email: { key1: 'value1' }
      };
      var docInFeatures = {
        modules: [{
          name: 'configurations',
          features: [{
            name: 'mail',
            value: configInFeatures
          }]
        }]
      };

      q.all([
        q.nfcall(saveDoc, 'configuration', docInMongoConfig),
        q.nfcall(saveDoc, 'features', docInFeatures)
      ])
      .then(function() {
        getModule()('mail')
          .getFromAllDomains()
          .then(function(configs) {
            expect(configs).to.deep.equal([{
              domainId: null,
              config: configInFeatures
            }]);
            done();
          }, done.bind(null, 'should resolve'));
      });
    });

  });

  describe('The store fn', function() {

    var checkDoc;

    beforeEach(function() {
      checkDoc = this.helpers.mongo.checkDoc.bind(this.helpers.mongo);
    });

    it('should store configuration in "configurations" collection', function(done) {
      var domainId = new ObjectId();

      getModule()('mail')
        .forUser({ preferredDomainId: domainId })
        .inModule('some_module')
        .store({ key: 'value' })
        .then(function() {
          checkDoc('configurations', { domain_id: domainId }, function(doc) {
            expect(doc).to.shallowDeepEqual({
              domain_id: String(domainId),
              modules: [{
                name: 'some_module',
                configurations: [{
                  name: 'mail',
                  value: { key: 'value' }
                }]
              }]
            });
          }, done);
        });
    });

    it('should store user configuration in "configurations" collection', function(done) {
      const domainId = new ObjectId();
      const userId = new ObjectId();
      const isUserWide = true;

      getModule()('mail')
        .forUser({ _id: userId, preferredDomainId: domainId }, isUserWide)
        .inModule('some_module')
        .store({ key: 'value' })
        .then(function() {
          checkDoc('configurations', { domain_id: domainId, user_id: userId }, function(doc) {
            expect(doc).to.shallowDeepEqual({
              domain_id: String(domainId),
              user_id: String(userId),
              modules: [{
                name: 'some_module',
                configurations: [{
                  name: 'mail',
                  value: { key: 'value' }
                }]
              }]
            });
          }, done);
        });
    });

    it('should allow store empty object (test Schema\'s minimize option)', function(done) {
      var domainId = new ObjectId();

      getModule()('mail')
        .forUser({ preferredDomainId: domainId })
        .inModule('some_module')
        .store({})
        .then(function() {
          checkDoc('configurations', { domain_id: domainId }, function(doc) {
            expect(doc).to.shallowDeepEqual({
              domain_id: String(domainId),
              modules: [{
                name: 'some_module',
                configurations: [{
                  name: 'mail',
                  value: {}
                }]
              }]
            });
          }, done);
        });
    });

  });

  describe('The set fn', function() {
    let checkDoc;

    beforeEach(function() {
      checkDoc = this.helpers.mongo.checkDoc.bind(this.helpers.mongo);
    });

    it('should store the value when no key specified (use promise)', function(done) {
      const domainId = new ObjectId();
      const value = ['my', 'value', 'is an array'];

      getModule()('mail')
        .forUser({ preferredDomainId: domainId })
        .inModule('some_module')
        .set(value)
        .then(() => {
          checkDoc('configurations', { domain_id: domainId }, doc => {
            expect(doc).to.shallowDeepEqual({
              domain_id: String(domainId),
              modules: [{
                name: 'some_module',
                configurations: [{
                  name: 'mail',
                  value
                }]
              }]
            });
          }, done);
        });
    });

    it('should store the value when no key specified (use callback)', function(done) {
      const domainId = new ObjectId();
      const value = ['my', 'value', 'is an array'];

      getModule()('mail')
        .forUser({ preferredDomainId: domainId })
        .inModule('some_module')
        .set(value, err => {
          expect(err).to.not.exist;

          checkDoc('configurations', { domain_id: domainId }, doc => {
            expect(doc).to.shallowDeepEqual({
              domain_id: String(domainId),
              modules: [{
                name: 'some_module',
                configurations: [{
                  name: 'mail',
                  value
                }]
              }]
            });
          }, done);
        });
    });

    it('should store the value specified key (use promise)', function(done) {
      const domainId = new ObjectId();
      const value = ['my', 'value', 'is an array'];

      getModule()('mail')
        .forUser({ preferredDomainId: domainId })
        .inModule('some_module')
        .set('key1.key2', value)
        .then(() => {
          checkDoc('configurations', { domain_id: domainId }, doc => {
            expect(doc).to.shallowDeepEqual({
              domain_id: String(domainId),
              modules: [{
                name: 'some_module',
                configurations: [{
                  name: 'mail',
                  value: { key1: { key2: value } }
                }]
              }]
            });
          }, done);
        });
    });

    it('should store the value when no key specified (use callback)', function(done) {
      const domainId = new ObjectId();
      const value = ['my', 'value', 'is an array'];

      getModule()('mail')
        .forUser({ preferredDomainId: domainId })
        .inModule('some_module')
        .set('key1.key2', value, err => {
          expect(err).to.not.exist;

          checkDoc('configurations', { domain_id: domainId }, doc => {
            expect(doc).to.shallowDeepEqual({
              domain_id: String(domainId),
              modules: [{
                name: 'some_module',
                configurations: [{
                  name: 'mail',
                  value: { key1: { key2: value } }
                }]
              }]
            });
          }, done);
        });
    });

  });

  describe('The onChange fn', function() {
    let pubsub, esnConfig, client;

    beforeEach(function(done) {
      const doc = {
        modules: [{
          name: 'core',
          configurations: [{
            name: 'amqp',
            value: { url: this.testEnv.serversConfig.rabbitmq.url }
          }]
        }]
      };

      esnConfig = getModule();
      pubsub = this.helpers.requireBackend('core/pubsub').global;

      saveDoc('configurations', doc, () => {
        this.helpers.requireBackend('core/amqp')
          .getClient()
          .then(clientInstance => {
            client = clientInstance;
            pubsub.setClient(client);
          })
          .then(() => done())
          .catch(err => done(err || 'Cannot create the amqp client'));
      });
    });

    afterEach(function(done) {
      client.dispose(() => done());
    });

    it('should call the listener when the desired config changed', function(done) {
      esnConfig.constants.CONFIG_METADATA.core.configurations.mail = { pubsub: true };

      esnConfig('mail')
        .onChange(
          () => done(),
          err => done(err || 'failed to subscribe pubsub event')
        )
        .then(() => {
          pubsub.topic(esnConfig.constants.EVENTS.CONFIG_UPDATED).publish({
            moduleName: 'core',
            domainId: null,
            configsUpdated: [{
              name: 'mail',
              value: 'some new value'
            }]
          });
        });
    });
  });

  describe('pubsub on config updated', function() {
    let pubsub, esnConfig, client;

    beforeEach(function(done) {
      const doc = {
        modules: [{
          name: 'core',
          configurations: [{
            name: 'amqp',
            value: { url: this.testEnv.serversConfig.rabbitmq.url }
          }]
        }]
      };

      esnConfig = getModule();
      pubsub = this.helpers.requireBackend('core/pubsub').global;

      saveDoc('configurations', doc, () => {
        this.helpers.requireBackend('core/amqp')
          .getClient()
          .then(clientInstance => {
            client = clientInstance;
            pubsub.setClient(client);
          })
          .then(() => done())
          .catch(err => done(err || 'Cannot create the amqp client'));
      });

    });

    afterEach(function(done) {
      client.dispose(() => done());
    });

    it('should publish event when it sets config with pubsub enabled', function(done) {
      const config = {
        name: 'mail',
        value: { key: 'value' }
      };
      const subscriber = message => {
        expect(message).to.shallowDeepEqual({
          moduleName: 'core',
          configsUpdated: [config]
        });
        done();
      };

      esnConfig.constants.CONFIG_METADATA.core.configurations.mail = { pubsub: true };

      client
        .subscribe(esnConfig.constants.EVENTS.CONFIG_UPDATED, subscriber)
        .then(() => esnConfig(config.name).set(config.value));
    });

  });
});
