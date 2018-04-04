'use strict';

var expect = require('chai').expect;
var request = require('supertest');
var async = require('async');
var ObjectId = require('bson').ObjectId;

describe('The communities API', function() {

  var email = 'user@open-paas.org', password = 'secret';
  var user, Community, CommunityArchive, User, Domain, webserver, fixtures, helpers, userDomainModule;

  function saveEntity(Model, entity, done) {
    new Model(entity).save(helpers.callbacks.noErrorAnd(function(saved) {
      entity._id = saved._id;
      done();
    }));
  }

  function saveCommunity(community, done) { saveEntity(Community, community, done); }
  function saveDomain(domain, done) { saveEntity(Domain, domain, done); }
  function saveUser(user, done) { saveEntity(User, user, done); }

  beforeEach(function(done) {
    helpers = this.helpers;

    this.mongoose = require('mongoose');
    this.testEnv.initCore(function() {
      helpers.elasticsearch.saveTestConfiguration(function() {
        Community = helpers.requireBackend('core/db/mongo/models/community');
        CommunityArchive = helpers.requireBackend('core/db/mongo/models/community-archive');
        User = helpers.requireBackend('core/db/mongo/models/user');
        Domain = helpers.requireBackend('core/db/mongo/models/domain');
        fixtures = helpers.requireFixture('models/users.js')(User);
        webserver = helpers.requireBackend('webserver').webserver;
        userDomainModule = helpers.requireBackend('core/user/domain');

        saveUser(user = fixtures.newDummyUser([email], password), done);
      });
    });
  });

  afterEach(function(done) {
    this.helpers.mongo.dropDatabase(done);
  });

  describe('GET /api/communities', function() {
    it('should send back 401 when not logged in', function(done) {
      helpers.api.requireLogin(webserver.application, 'get', '/api/communities', done);
    });

    it('should send back 400 if domain is not defined', function(done) {
      async.series([
        function(callback) {
          saveCommunity({title: 'Node.js'}, callback);
        },
        function(callback) {
          saveCommunity({title: 'Mean'}, callback);
        },
        function() {
          helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
            if (err) {
              return done(err);
            }
            var req = loggedInAsUser(request(webserver.application).get('/api/communities'));
            req.expect(400);
            req.end(function(err) {
              expect(err).to.not.exist;
              done();
            });
          });
        }],
        function(err) {
          done(err);
        }
      );
    });

    it('should return an array of communities in the given domain', function(done) {
      var domain = {
        name: 'MyDomain',
        company_name: 'open-paas.org',
        administrators: [{ user_id: user._id }]
      };
      var domain2 = {
        name: 'MyDomain2',
        company_name: 'MyAwesomeCompany2'
      };

      async.series([
        function(callback) {
          saveDomain(domain, callback);
        },
        function(callback) {
          saveDomain(domain2, callback);
        },
        function(callback) {
          userDomainModule.joinDomain(user, domain, callback);
        },
        function(callback) {
          saveCommunity({title: 'Node.js', domain_ids: [domain._id]}, callback);
        },
        function(callback) {
          saveCommunity({title: 'Mean', domain_ids: [domain._id]}, callback);
        },
        function(callback) {
          saveCommunity({title: 'Angular', domain_ids: [domain2._id]}, callback);
        },
        function() {
          helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
            if (err) {
              return done(err);
            }
            var req = loggedInAsUser(request(webserver.application).get('/api/communities?domain_id=' + domain._id));
            req.expect(200);
            req.end(function(err, res) {
              expect(err).to.not.exist;
              expect(res.body).to.exist;
              expect(res.body).to.be.an.array;
              expect(res.body.length).to.equal(2);

              var valid = res.body.filter(function(community) {
                return community.title === 'Node.js' || community.title === 'Mean';
              });
              expect(valid.length).to.equal(2);
              done();
            });
          });
        }],
        function(err) {
          done(err);
        }
      );
    });

    it('should return list and filter communities according to their title (case insensitive)', function(done) {
      var domain = {
        name: 'MyDomain',
        company_name: 'open-paas.org',
        administrators: [{ user_id: user._id }]
      };

      var title = 'test1';
      var titleWithUpperCase = 'TesT1';

      async.series([
          function(callback) {
            saveDomain(domain, callback);
          },
          function(callback) {
            userDomainModule.joinDomain(user, domain, callback);
          },
          function(callback) {
            saveCommunity({title: title, domain_ids: [domain._id]}, callback);
          },
          function(callback) {
            saveCommunity({title: titleWithUpperCase, domain_ids: [domain._id]}, callback);
          },
          function(callback) {
            saveCommunity({title: 'test2', domain_ids: [domain._id]}, callback);
          },
          function() {
            helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
              if (err) {
                return done(err);
              }
              var req = loggedInAsUser(request(webserver.application).get('/api/communities?domain_id=' + domain._id + '&title=' + title));
              req.expect(200);
              req.end(function(err, res) {
                expect(err).to.not.exist;
                expect(res.body).to.exist;
                expect(res.body).to.be.an.array;
                expect(res.body.length).to.equal(2);

                var valid = res.body.filter(function(community) {
                  return community.title === titleWithUpperCase || community.title === title;
                });
                expect(valid.length).to.equal(2);
                done();
              });
            });
          }],
        function(err) {
          done(err);
        }
      );
    });

    it('should return list and filter communities according to their creator', function(done) {
      var domain = {
        name: 'MyDomain',
        company_name: 'open-paas.org',
        administrators: [{ user_id: user._id }]
      };
      var user2 = fixtures.newDummyUser(['user2@linagora.com'], 'pwd');
      var title = 'C1';

      async.series([
          function(callback) {
            saveUser(user2, callback);
          },
          function(callback) {
            saveDomain(domain, callback);
          },
          function(callback) {
            userDomainModule.joinDomain(user, domain, callback);
          },
          function(callback) {
            saveCommunity({title: title, domain_ids: [domain._id], creator: user._id}, callback);
          },
          function(callback) {
            saveCommunity({title: 'C2', domain_ids: [domain._id], creator: user2._id}, callback);
          },
          function(callback) {
            saveCommunity({title: 'C3', domain_ids: [domain._id]}, callback);
          },
          function() {
            helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
              if (err) {
                return done(err);
              }
              var req = loggedInAsUser(request(webserver.application).get('/api/communities?domain_id=' + domain._id + '&creator=' + user._id));
              req.expect(200);
              req.end(function(err, res) {
                expect(err).to.not.exist;
                expect(res.body).to.exist;
                expect(res.body).to.be.an.array;
                expect(res.body.length).to.equal(1);
                var community = res.body[0];
                expect(community.title).to.equal(title);
                expect(community.creator).to.equal(user._id.toString());
                done();
              });
            });
          }],
        function(err) {
          done(err);
        }
      );
    });

    it('should return list and filter communities according to their type', function(done) {
      var domain = {
        name: 'MyDomain',
        company_name: 'open-paas.org',
        administrators: [{ user_id: user._id }]
      };
      var title = 'C1';
      var type = 'confidential';
      var members = [{member: {objectType: 'user', id: String(user._id)}, status: 'joined'}];

      async.series([
          function(callback) {
            saveDomain(domain, callback);
          },
          function(callback) {
            userDomainModule.joinDomain(user, domain, callback);
          },
          function(callback) {
            saveCommunity({title: title, domain_ids: [domain._id], creator: user._id, type: type, members: members}, callback);
          },
          function(callback) {
            saveCommunity({title: 'C2', domain_ids: [domain._id], creator: user._id, type: 'open', members: members}, callback);
          },
          function(callback) {
            saveCommunity({title: 'C3', domain_ids: [domain._id], creator: user._id, type: 'private', members: members}, callback);
          },
          function() {
            helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
              if (err) {
                return done(err);
              }
              var req = loggedInAsUser(request(webserver.application).get('/api/communities?domain_id=' + domain._id + '&creator=' + user._id + '&type=' + type));
              req.expect(200);
              req.end(function(err, res) {
                expect(err).to.not.exist;
                expect(res.body).to.exist;
                expect(res.body).to.be.an.array;
                expect(res.body.length).to.equal(1);
                var community = res.body[0];
                expect(community.title).to.equal(title);
                expect(community.creator).to.equal(user._id.toString());
                done();
              });
            });
          }],
        function(err) {
          done(err);
        }
      );
    });

    it('should not return confidential communities if not creator', function(done) {
      var domain = {
        name: 'MyDomain',
        company_name: 'open-paas.org',
        administrators: [{ user_id: user._id }]
      };
      var user2 = fixtures.newDummyUser(['user2@linagora.com'], 'pwd');
      var title = 'C1';

      async.series([
          function(callback) {
            saveUser(user2, callback);
          },
          function(callback) {
            saveDomain(domain, callback);
          },
          function(callback) {
            userDomainModule.joinDomain(user, domain, callback);
          },
          function(callback) {
            saveCommunity({title: title, domain_ids: [domain._id], creator: user2._id, type: 'confidential'}, callback);
          },
          function() {
            helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
              if (err) {
                return done(err);
              }
              var req = loggedInAsUser(request(webserver.application).get('/api/communities?domain_id=' + domain._id));
              req.expect(200);
              req.end(function(err, res) {
                expect(err).to.not.exist;
                expect(res.body).to.deep.equal([]);
                done();
              });
            });
          }],
        function(err) {
          done(err);
        }
      );
    });

    describe('membershipRequests', function() {

      beforeEach(function(done) {
        var self = this;
        helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
          if (err) { done(err); }
          self.domain = models.domain;
          self.user = models.users[0];
          self.user2 = models.users[1];

          self.membershipRequest = {
            user: self.user2._id,
            timestamp: {
              creation: new Date(1419509532000)
            },
            workflow: 'workflow'
          };

          helpers.api.createCommunity('Node', self.user, self.domain, {membershipRequests: [self.membershipRequest]},
                                           function(err, saved) {
            if (err) { return done(err); }
            self.community = saved;
            done();
          });
        });
      });

      it('should return the membershipRequest date', function(done) {

        var self = this;
        helpers.api.loginAsUser(webserver.application, this.user2.emails[0], 'secret', function(err, loggedInAsUser) {

          if (err) { return done(err); }

          var req = loggedInAsUser(request(webserver.application).get('/api/communities?domain_id=' + self.domain._id));

          req.expect(200);

          req.end(function(err, res) {

            expect(err).to.not.exist;
            expect(res.body).to.exist;
            expect(res.body).to.be.an('array');
            var community = res.body.filter(function(c) {
              return c.title === 'Node';
            });

            expect(community.length).to.equal(1);
            expect(community[0]).to.have.property('membershipRequest');
            expect(community[0].membershipRequest).to.equal(1419509532000);
            done();
          });
        });
      });

    });
  });

  describe('POST /api/communities', function() {
    it('should send back 401 when not logged in', function(done) {
      helpers.api.requireLogin(webserver.application, 'post', '/api/communities', done);
    });

    it('should not create the community when user is not domain member', function(done) {
      var domain = {
        name: 'MyDomain',
        company_name: 'MyAwesomeCompany'
      };
      var community = {
        title: 'Node.js',
        description: 'This is the community description'
      };

      async.series([
        function(callback) {
          saveDomain(domain, callback);
        },
        function() {
          community.domain_ids = [domain._id];
          helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
            if (err) {
              return done(err);
            }
            var req = loggedInAsUser(request(webserver.application).post('/api/communities'));
            req.send(community);
            req.expect(403);
            req.end(function(err) {
              expect(err).to.not.exist;
              done();
            });
          });
        }
      ],
        function(err) {
          return done(err);
        }
      );
    });

    it('should create the community', function(done) {
      var community = {
        title: 'Node.js',
        description: 'This is the community description'
      };
      var domain = {
        name: 'MyDomain',
        company_name: 'MyAwesomeCompany'
      };

      async.series([
        function(callback) {
          domain.administrators = [{ user_id: user._id }];
          saveDomain(domain, callback);
        },
        function() {
          community.domain_ids = [domain._id];

          helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
            if (err) {
              return done(err);
            }
            var req = loggedInAsUser(request(webserver.application).post('/api/communities'));
            req.send(community);
            req.expect(201);
            req.end(function(err, res) {
              expect(err).to.not.exist;
              expect(res.body).to.exist;
              expect(res.body.creator).to.exist;
              expect(res.body.creator).to.equal(user.id);
              expect(res.body.title).to.equal(community.title);
              expect(res.body.description).to.equal(community.description);

              Community.find(function(err, result) {
                if (err) {
                  return done(err);
                }
                expect(result).to.exist;
                expect(result.length).to.equal(1);
                expect(result[0].title).to.equal(community.title);
                expect(result[0].description).to.equal(community.description);
                expect(result[0].creator + '').to.equal(user.id);
                expect(result[0].members[0].member.id + '').to.equal(user.id);
                done();
              });
            });
          });

        }
      ], function(err) {
        return done(err);
      });
    });

    it('should not store the community if one with the same name already exists', function(done) {
      var community = {
        title: 'Node.js',
        description: 'This is the community description'
      };
      var domain = {
        name: 'MyDomain',
        company_name: 'MyAwesomeCompany'
      };

      async.series([
        function(callback) {
          domain.administrators = [{ user_id: user._id }];
          saveDomain(domain, callback);
        },
        function(callback) {
          community.domain_ids = [domain._id];
          saveCommunity(community, callback);
        },
        function() {
          helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
            if (err) {
              return done(err);
            }
            var req = loggedInAsUser(request(webserver.application).post('/api/communities'));
            req.send(community);
            req.expect(403);
            req.end(function(err) {
              expect(err).to.not.exist;

              Community.find(function(err, result) {
                if (err) {
                  return done(err);
                }
                expect(result).to.exist;
                expect(result.length).to.equal(1);
                done();
              });
            });
          });
        }
      ], function(err) {
        if (err) {
          return done(err);
        }
      });
    });

    it('should store a community with existing name if noTitleCheck param exists', function(done) {
      var community = {
        title: 'Node.js',
        description: 'This is the community description'
      };
      var domain = {
        name: 'MyDomain',
        company_name: 'MyAwesomeCompany'
      };

      async.series([
        function(callback) {
          domain.administrators = [{ user_id: user._id }];
          saveDomain(domain, callback);
        },
        function(callback) {
          community.domain_ids = [domain._id];
          saveCommunity(community, callback);
        },
        function() {
          helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
            if (err) {
              return done(err);
            }
            var req = loggedInAsUser(request(webserver.application).post('/api/communities?noTitleCheck=true'));
            req.send(community);
            req.expect(201);
            req.end(function(err) {
              expect(err).to.not.exist;

              Community.find(function(err, result) {
                if (err) {
                  return done(err);
                }
                expect(result).to.exist;
                expect(result.length).to.equal(2);
                done();
              });
            });
          });
        }
      ], function(err) {
        if (err) {
          return done(err);
        }
      });
    });
  });

  describe('GET /api/communities/:id', function() {

    it('should send back 401 when not logged in', function(done) {
      helpers.api.requireLogin(webserver.application, 'get', '/api/communities/123', done);
    });

    it('should get 404 if community does not exist', function(done) {
      var ObjectId = require('bson').ObjectId;
      var id = new ObjectId();
      helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(webserver.application).get('/api/communities/' + id));
        req.expect(404);
        req.end(function(err) {
          expect(err).to.be.null;
          done();
        });
      });
    });

    it('should get the community information even if the user is not a community member', function(done) {
      var community = {
        title: 'Node.js',
        description: 'This is the community description'
      };
      var domain = {
        name: 'MyDomain',
        company_name: 'MyAwesomeCompany'
      };
      var foouser = fixtures.newDummyUser(['foo@bar.com'], 'secret');

      async.series([
        function(callback) {
          saveUser(foouser, callback);
        },
        function(callback) {
          domain.administrators = [{ user_id: foouser._id }];
          saveDomain(domain, callback);
        },
        function(callback) {
          community.creator = foouser._id;
          community.domain_ids = [domain._id];
          saveCommunity(community, callback);
        },
        function() {
          helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
            if (err) {
              return done(err);
            }
            var req = loggedInAsUser(request(webserver.application).get('/api/communities/' + community._id));
            req.expect(200);
            req.end(function(err) {
              expect(err).to.not.exist;
              done();
            });
          });
        }
      ], function(err) {
        if (err) {
          return done(err);
        }
      });
    });

    it('should not get the community information if the community is confidential', function(done) {
      var confidentialCommunity = {
        title: 'Node.js',
        description: 'This is the community description',
        type: 'confidential'
      };

      var domain = {
        name: 'MyDomain',
        company_name: 'MyAwesomeCompany'
      };
      var foouser = fixtures.newDummyUser(['foo@bar.com'], 'secret');

      async.series([
        function(callback) {
          saveUser(foouser, callback);
        },
        function(callback) {
          domain.administrators = [{ user_id: foouser._id }];
          saveDomain(domain, callback);
        },
        function(callback) {
          confidentialCommunity.creator = foouser._id;
          confidentialCommunity.domain_ids = [domain._id];
          saveCommunity(confidentialCommunity, callback);
        },
        function() {
          helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
            if (err) {
              return done(err);
            }
            var req = loggedInAsUser(request(webserver.application).get('/api/communities/' + confidentialCommunity._id));
            req.expect(403);
            req.end(function(err) {
              expect(err).to.not.exist;
              done();
            });
          });
        }
      ], function(err) {
        if (err) {
          return done(err);
        }
      });
    });

    it('should retrieve a community from its ID', function(done) {
      var community = {
        title: 'Node.js',
        description: 'This is the community description'
      };
      var domain = {
        name: 'MyDomain',
        company_name: 'MyAwesomeCompany'
      };
      var foouser = fixtures.newDummyUser(['foo@bar.com'], 'secret');

      async.series([
        function(callback) {
          saveUser(foouser, callback);
        },
        function(callback) {
          domain.administrators = [{ user_id: user._id }];
          saveDomain(domain, callback);
        },
        function(callback) {
          community.creator = foouser._id;
          community.domain_ids = [domain._id];
          saveCommunity(community, callback);
        },
        function() {
          helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
            if (err) {
              return done(err);
            }
            var req = loggedInAsUser(request(webserver.application).get('/api/communities/' + community._id));
            req.expect(200);
            req.end(function(err, res) {
              expect(err).to.not.exist;
              expect(res.body._id).to.exist;
              expect(res.body.title).to.equal(community.title);
              expect(res.body.description).to.equal(community.description);
              done();
            });
          });
        }
      ], function(err) {
        if (err) {
          return done(err);
        }
      });
    });

    it('should return the number of members and not the members list', function(done) {
      helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
        if (err) {
          return done(err);
        }
        helpers.api.loginAsUser(webserver.application, models.users[0].emails[0], 'secret', function(err, loggedInAsUser) {
          if (err) {
            return done(err);
          }
          var req = loggedInAsUser(request(webserver.application).get('/api/communities/' + models.communities[0]._id));
          req.expect(200);
          req.end(function(err, res) {
            expect(err).to.not.exist;
            expect(res.body).to.exist;
            expect(res.body.members).to.not.exist;
            expect(res.body.members_count).to.exist;
            expect(res.body.members_count).to.equal(2);
            done();
          });
        });
      });
    });

    it('should return "member" in member_status if current user is member of the community', function(done) {
      helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
        if (err) {
          return done(err);
        }
        helpers.api.loginAsUser(webserver.application, models.users[0].emails[0], 'secret', function(err, loggedInAsUser) {
          if (err) {
            return done(err);
          }
          var req = loggedInAsUser(request(webserver.application).get('/api/communities/' + models.communities[0]._id));
          req.expect(200);
          req.end(function(err, res) {
            expect(err).to.not.exist;
            expect(res.body.member_status).to.exist;
            expect(res.body.member_status).to.equal('member');
            done();
          });
        });
      });
    });
  });

  describe('GET /api/communities/:id/avatar', function() {
    it('should send back 401 when not logged in', function(done) {
      helpers.api.requireLogin(webserver.application, 'get', '/api/communities/123/avatar', done);
    });
  });

  describe('POST /api/communities/:id/avatar', function() {
    it('should send back 401 when not logged in', function(done) {
      helpers.api.requireLogin(webserver.application, 'post', '/api/communities/123/avatar', done);
    });
  });

  describe('DELETE /api/communities/:id', function() {
    let community, creator, user;

    beforeEach(function(done) {
      helpers.api.applyDomainDeployment('linagora_IT', (err, models) => {
        if (err) {
          return done(err);
        }
        user = models.users[1];
        creator = models.users[0];
        community = models.communities[0];
        done();
      });
    });

    it('should send back 401 when not logged in', function(done) {
      helpers.api.requireLogin(webserver.application, 'delete', '/api/communities/123', done);
    });

    it('should send back 404 when community can not be found', function(done) {
      const id = new ObjectId();

      helpers.api.loginAsUser(webserver.application, creator.emails[0], 'secret', (err, loggedInAsUser) => {
        if (err) {
          return done(err);
        }

        loggedInAsUser(request(webserver.application).delete(`/api/communities/${id}`))
          .expect(404)
          .end(err => {
            expect(err).to.not.exist;
            done();
          });
      });
    });

    it('should send back 403 when user is not community manager', function(done) {
      helpers.api.loginAsUser(webserver.application, user.emails[0], 'secret', (err, loggedInAsUser) => {
        if (err) {
          return done(err);
        }

        loggedInAsUser(request(webserver.application).delete(`/api/communities/${community._id}`))
          .expect(403)
          .end(err => {
            expect(err).to.not.exist;
            done();
          });
      });
    });

    it('should archive the community', function(done) {
      helpers.api.loginAsUser(webserver.application, creator.emails[0], 'secret', (err, loggedInAsUser) => {
        if (err) {
          return done(err);
        }

        loggedInAsUser(request(webserver.application).delete(`/api/communities/${community._id}`))
          .expect(204)
          .end(err => {
            expect(err).to.not.exist;

            Community.find({_id: community._id})
              .then(document => {
                expect(document).to.be.empty;
              })
              .then(() => CommunityArchive.find({ _id: community._id }))
              .then(archive => {
                expect(archive).to.have.lengthOf(1);
                expect('' + archive[0]._id).to.equals('' + community._id);
              })
              .then(() => done())
              .catch(done);
          });
        });
    });
  });

  describe('PUT /api/communities/:id', function() {

    beforeEach(function(done) {
      var self = this;
      saveUser(self.userInCommunity = fixtures.newDummyUser(['user2@open-paas.org'], password), function() {
        var domain = {
          name: 'MyDomain',
          company_name: 'open-paas.org',
          administrators: [{ user_id: user._id }]
        };

        self.title = 'toto';
        self.avatar = new ObjectId();
        self.newUser = new ObjectId();
        self.userToRemove = self.userInCommunity._id;
        self.body = {
          title: self.title,
          avatar: self.avatar,
          newMembers: [self.newUser],
          deleteMembers: [self.userToRemove]
        };

        self.community = {
          creator: user._id,
          title: 'test',
          domain_ids: [domain._id],
          members:
            {member: {objectType: 'user', id: self.userInCommunity._id}}
        };

        async.series([
            function(callback) {
              saveDomain(domain, callback);
            },
            function(callback) {
              userDomainModule.joinDomain(user, domain, callback);
            },
            function(callback) {
              saveCommunity(self.community, callback);
            }
            ], function(err) {
              if (err) {
                return done(err);
              }
            });
        done();
      });
    });

    it('should return 200 if updated changed', function(done) {
      var self = this;
      this.helpers.api.loginAsUser(webserver.application, user.emails[0], 'secret', function(err, loggedInAsUser) {
        if (err) { return done(err); }
        var req = loggedInAsUser(request(webserver.application).put('/api/communities/' + self.community._id));
        req.send(self.body);
        req.expect(200);
        req.end(function(err) {
          expect(err).to.not.exist;
          Community.find({_id: self.community._id}, function(err, document) {
            if (err) {
              return done(err);
            }
            expect(document[0].title).to.equal(self.title);
            expect(document[0].avatar.toString()).to.equal(self.avatar.toString());
            expect(document[0].members.length).to.equal(1);
            done();
          });
        });
      });
    });

    it('should return 400 if no body', function(done) {
      var self = this;
      this.helpers.api.loginAsUser(webserver.application, user.emails[0], 'secret', function(err, loggedInAsUser) {
        if (err) { return done(err); }
        var req = loggedInAsUser(request(webserver.application).put('/api/communities/' + self.community._id));
        req.expect(400);
        req.end(function(err) {
          expect(err).to.not.exist;
          done();
        });
      });
    });

    it('should return 401 user not connected', function(done) {
      var self = this;
      this.helpers.api.requireLogin(webserver.application, 'put', '/api/communities/' + self.community._id, function(err, res) {
        if (err) { done(err); }
        expect(res.status).to.be.equal(401);
        done();
      });
    });

    it('should return 403 if user not in community', function(done) {
      var self = this;
      this.helpers.api.loginAsUser(webserver.application, self.userInCommunity.emails[0], 'secret', function(err, loggedInAsUser) {
        if (err) { return done(err); }
        var req = loggedInAsUser(request(webserver.application).put('/api/communities/' + self.community._id));
        req.send(self.body);
        req.expect(403);
        req.end(function(err) {
          expect(err).to.not.exist;
          done();
        });
      });
    });
  });
});
