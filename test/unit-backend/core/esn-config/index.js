'use strict';

var mockery = require('mockery');
var sinon = require('sinon');
var expect = require('chai').expect;

describe('The core/esn-config module', function() {

  var confModuleMock;
  var configurationMock, featuresModelMock;

  beforeEach(function() {

    configurationMock = {
      modules: [{
        name: 'core',
        configurations: [{
          name: 'config1',
          value: 'config1'
        }, {
          name: 'config2',
          value: { key1: { key2: 'config2' } }
        }]
      }, {
        name: 'inbox',
        configurations: [{
          name: 'inbox1',
          value: 'inbox1'
        }, {
          name: 'inbox2',
          value: 'inbox2'
        }]
      }]
    };

    confModuleMock = {};
    featuresModelMock = {};

    mockery.registerMock('../configuration', confModuleMock);
    mockery.registerMock('../../db/mongo/models/features', featuresModelMock);

    this.getModule = function() {
      return this.helpers.requireBackend('core/esn-config');
    };
  });

  describe('The get fn', function() {

    beforeEach(function() {
      confModuleMock.findByDomainId = function(domainId, callback) {
        callback(null, configurationMock);
      };
    });

    it('should return promise that resolves configuration', function(done) {
      this.getModule()('config1').get().then(function(data) {
        expect(data).to.equal('config1');
        done();
      });
    });

    it('should call callback with configuration', function(done) {
      this.getModule()('config1').get(function(err, data) {
        expect(err).to.not.exist;
        expect(data).to.equal('config1');
        done();
      });
    });

    it('should support getting configuration from custom module', function(done) {
      this.getModule()('inbox1').inModule('inbox').get(function(err, data) {
        expect(err).to.not.exist;
        expect(data).to.equal('inbox1');
        done();
      });
    });

    it('should support getting configuration for specified domain', function(done) {
      var user = {
        preferredDomainId: 'domain123'
      };

      confModuleMock.findByDomainId = sinon.spy(function(domainId, callback) {
        expect(domainId).to.equal(user.preferredDomainId);
        callback(null, configurationMock);
      });

      this.getModule()('config1').forUser(user).get(function(err, data) {
        expect(err).to.not.exist;
        expect(data).to.equal('config1');
        done();
      });
    });

    it('should support getting configuration key', function(done) {
      var key = 'key1.key2';

      this.getModule()('config2').get(key, function(err, data) {
        expect(err).to.not.exist;
        expect(data).to.equal('config2');
        done();
      });
    });

    it('should support getting configuration key (in promise style)', function(done) {
      var key = 'key1.key2';

      this.getModule()('config2').get(key).then(function(data) {
        expect(data).to.equal('config2');
        done();
      });
    });

    describe('Fallback when get system-wide configuration', function() {

      var CONFIG_DATA = { key1: { key2: 'value' } };
      var mongoconfigMock;

      beforeEach(function() {
        mongoconfigMock = sinon.spy(function() {
          return {
            get: function(callback) {
              callback(null, CONFIG_DATA);
            }
          };
        });

        mongoconfigMock.setDefaultMongoose = function() {};

        mockery.registerMock('mongoconfig', mongoconfigMock);
      });

      it('should fallback to mongoconfig when there is no configuration found in configurations collection', function(done) {
        var key = 'key1.key2';
        var configName = 'some_name';

        confModuleMock.findByDomainId = function(domainId, callback) {
          callback(null, null);
        };

        this.getModule()(configName).get(key, function(err, data) {
          expect(err).to.not.exist;
          expect(data).to.equal(CONFIG_DATA.key1.key2);
          expect(mongoconfigMock).to.have.been.calledWith(configName);
          done();
        });
      });

      it('should fallback to mongoconfig when there is error while getting data from configurations collection', function(done) {
        var key = 'key1.key2';
        var configName = 'some_name';

        confModuleMock.findByDomainId = function(domainId, callback) {
          callback(new Error('some_error'));
        };

        this.getModule()(configName).get(key, function(err, data) {
          expect(err).to.not.exist;
          expect(data).to.equal(CONFIG_DATA.key1.key2);
          expect(mongoconfigMock).to.have.been.calledWith(configName);
          done();
        });
      });

    });

    describe('Fallback when get domain-wide configuration', function() {

      var USER = { preferredDomainId: 'domain123' };

      describe('Fallback to features collection', function() {

        beforeEach(function() {
          featuresModelMock.findOne = function(query) {
            expect(query).to.deep.equal({ domain_id: USER.preferredDomainId });

            return {
              lean: function() {
                return {
                  exec: function(callback) {
                    callback(null, {
                      modules: [{
                        name: 'configurations',
                        features: [{
                          name: 'config1',
                          value: 'config1'
                        }, {
                          name: 'config2',
                          value: { key1: { key2: 'config2' } }
                        }]
                      }, {
                        name: 'inbox',
                        features: [{
                          name: 'inbox1',
                          value: 'inbox1'
                        }, {
                          name: 'inbox2',
                          value: 'inbox2'
                        }]
                      }]
                    });
                  }
                };
              }
            };

          };
        });

        it('should fallback to use features collection when no configuration is found in configurations collection', function(done) {
          confModuleMock.findByDomainId = function(domainId, callback) {
            callback(null, null);
          };

          this.getModule()('config1').forUser(USER).get(function(err, data) {
            expect(err).to.not.exist;
            expect(data).to.equal('config1');
            done();
          });
        });

        it('should fallback to use features collection when no configuration is found in configurations collection (for specified module)', function(done) {
          confModuleMock.findByDomainId = function(domainId, callback) {
            callback(null, null);
          };

          this.getModule()('inbox1').inModule('inbox').forUser(USER).get(function(err, data) {
            expect(err).to.not.exist;
            expect(data).to.equal('inbox1');
            done();
          });
        });

        it('should fallback to use features collection when there is error while getting data from configurations collection', function(done) {
          confModuleMock.findByDomainId = function(domainId, callback) {
            callback(new Error('some_error'));
          };

          this.getModule()('config1').forUser(USER).get(function(err, data) {
            expect(err).to.not.exist;
            expect(data).to.equal('config1');
            done();
          });
        });

        it('should fallback to use features collection when there is error while getting data from configurations collection (for specified module)', function(done) {
          confModuleMock.findByDomainId = function(domainId, callback) {
            callback(new Error('some_error'));
          };

          this.getModule()('inbox1').inModule('inbox').forUser(USER).get(function(err, data) {
            expect(err).to.not.exist;
            expect(data).to.equal('inbox1');
            done();
          });
        });

      });

      describe('Fallback to mongoconfig', function() {

        beforeEach(function() {
          confModuleMock.findByDomainId = function(domainId, callback) {
            callback(null, null);
          };

          featuresModelMock.findOne = function() {
            return {
              lean: function() {
                return {
                  exec: function(query, callback) {
                    callback(null, null);
                  }
                };
              }
            };
          };
        });

        it('should fallback to use mongoconfig when no configuration is found in both configurations and features collections', function(done) {
          var CONFIG_DATA = { key1: { key2: 'value' } };
          var mongoconfigMock = sinon.spy(function() {
            return {
              get: function(callback) {
                callback(null, CONFIG_DATA);
              }
            };
          });
          var configName = 'some_name';
          var key = 'key1.key2';

          mongoconfigMock.setDefaultMongoose = function() {};
          mockery.registerMock('mongoconfig', mongoconfigMock);

          this.getModule()(configName).forUser(USER).get(key, function(err, data) {
            expect(err).to.not.exist;
            expect(data).to.equal(CONFIG_DATA.key1.key2);
            expect(mongoconfigMock).to.have.been.calledWith(configName);
            done();
          });
        });

      });
    });

  });

  describe('The getFromAllDomains fn', function() {

    it('should get configurations from all documents in configurations collection', function(done) {
      confModuleMock.getAll = function(callback) {
        callback(null, [{
          modules: [{
            name: 'inbox',
            configurations: [{
              name: 'inbox1',
              value: 'domain1'
            }]
          }]
        }, {
          modules: [{
            name: 'inbox',
            configurations: [{
              name: 'inbox1',
              value: 'domain2'
            }]
          }]
        }]);
      };

      this.getModule()('inbox1').inModule('inbox').getFromAllDomains(function(err, data) {
        expect(err).to.not.exist;
        expect(data).to.deep.equal(['domain1', 'domain2']);
        done();
      });
    });

    it('should fallback get configurations from all documents in features collection when no configuration found from configurations collection', function(done) {
      confModuleMock.getAll = function(callback) {
        callback(null, []);
      };

      featuresModelMock.find = function(query) {
        expect(query).to.deep.equal({});

        return {
          lean: function() {
            return {
              exec: function(callback) {
                callback(null, [{
                  modules: [{
                    name: 'core',
                    features: [{
                      name: 'key',
                      value: 'domain1'
                    }]
                  }]
                }, {
                  modules: [{
                    name: 'core',
                    features: [{
                      name: 'key',
                      value: 'domain2'
                    }]
                  }]
                }]);
              }
            };
          }
        };
      };

      this.getModule()('key').getFromAllDomains(function(err, data) {
        expect(err).to.not.exist;
        expect(data).to.deep.equal(['domain1', 'domain2']);
        done();
      });
    });

  });

  describe('The set fn', function() {

    beforeEach(function() {
      confModuleMock.findByDomainId = function(domainId, callback) {
        callback(null, configurationMock);
      };
    });

    it('should modify then update configuration to database', function(done) {
      var updatedConfiguration = {
        modules: [{
          name: 'core',
          configurations: [{
            name: 'config1',
            value: 'new value'
          }, {
            name: 'config2',
            value: { key1: { key2: 'config2' } }
          }]
        }, {
          name: 'inbox',
          configurations: [{
            name: 'inbox1',
            value: 'inbox1'
          }, {
            name: 'inbox2',
            value: 'inbox2'
          }]
        }]
      };

      confModuleMock.update = function(configuration, callback) {
        expect(configuration).to.deep.equal(updatedConfiguration);
        callback();
      };

      this.getModule()('config1').set('new value', function(err) {
        expect(err).to.not.exist;
        done();
      });
    });

    it('should support update configuration by key', function(done) {
      var updatedConfiguration = {
        modules: [{
          name: 'core',
          configurations: [{
            name: 'config1',
            value: 'config1'
          }, {
            name: 'config2',
            value: { key1: { key2: 'new value' } }
          }]
        }, {
          name: 'inbox',
          configurations: [{
            name: 'inbox1',
            value: 'inbox1'
          }, {
            name: 'inbox2',
            value: 'inbox2'
          }]
        }]
      };

      confModuleMock.update = function(configuration, callback) {
        expect(configuration).to.deep.equal(updatedConfiguration);
        callback();
      };

      this.getModule()('config2').set('key1.key2', 'new value', function(err) {
        expect(err).to.not.exist;
        done();
      });
    });

  });

  describe('The store fn', function() {

    beforeEach(function() {
      confModuleMock.findByDomainId = function(domainId, callback) {
        callback(null, configurationMock);
      };
    });

    it('should store configuration to database', function(done) {
      var updatedConfiguration = {
        modules: [{
          name: 'core',
          configurations: [{
            name: 'config1',
            value: { key: 'new value' }
          }, {
            name: 'config2',
            value: { key1: { key2: 'config2' } }
          }]
        }, {
          name: 'inbox',
          configurations: [{
            name: 'inbox1',
            value: 'inbox1'
          }, {
            name: 'inbox2',
            value: 'inbox2'
          }]
        }]
      };

      confModuleMock.update = function(configuration, callback) {
        expect(configuration).to.deep.equal(updatedConfiguration);
        callback();
      };

      this.getModule()('config1').store({ key: 'new value'}, function(err) {
        expect(err).to.not.exist;
        done();
      });
    });

  });
});
