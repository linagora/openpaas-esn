'use strict';

var expect = require('chai').expect;
var request = require('supertest');
var async = require('async');

// TODO remove this when /api/collaborations is done
describe.skip('The communities API', function() {

  var user;
  var email = 'user@open-paas.org';
  var password = 'secret';
  var Community, User, Domain, webserver;

  var saveCommunity = function(community, done) {
    var c = new Community(community);
    return c.save(function(err, saved) {
      if (err) {
        return done(err);
      }
      community._id = saved._id;
      return done();
    });
  };

  var saveDomain = function(domain, done) {
    var d = new Domain(domain);
    return d.save(function(err, saved) {
      if (err) {
        return done(err);
      }
      domain._id = saved._id;
      return done();
    });
  };

  var saveUser = function(user, done) {
    var u = new User(user);
    return u.save(function(err, saved) {
      if (err) {
        return done(err);
      }
      user._id = saved._id;
      return done();
    });
  };

  beforeEach(function(done) {
    var self = this;
    this.mongoose = require('mongoose');
    this.testEnv.initCore(function() {
      Community = require(self.testEnv.basePath + '/backend/core/db/mongo/models/community');
      User = require(self.testEnv.basePath + '/backend/core/db/mongo/models/user');
      Domain = require(self.testEnv.basePath + '/backend/core/db/mongo/models/domain');
      webserver = require(self.testEnv.basePath + '/backend/webserver').webserver;

      user = new User({password: password, emails: [email]});
      user.save(function(err, saved) {
        if (err) {
          return done(err);
        }
        user._id = saved._id;
        return done();
      });
    });
  });

  afterEach(function(done) {
    this.mongoose.connection.db.dropDatabase();
    this.mongoose.disconnect(done);
  });

  describe('GET /api/communities', function() {
    it('should send back 401 when not logged in', function(done) {
      request(webserver.application).get('/api/communities').expect(401).end(function(err, res) {
        expect(err).to.be.null;
        done();
      });
    });

    it('should send back 400 if domain is not defined', function(done) {
      var self = this;
      async.series([
        function(callback) {
          saveCommunity({title: 'Node.js'}, callback);
        },
        function(callback) {
          saveCommunity({title: 'Mean'}, callback);
        },
        function() {
          self.helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
            if (err) {
              return done(err);
            }
            var req = loggedInAsUser(request(webserver.application).get('/api/communities'));
            req.expect(400);
            req.end(function(err, res) {
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
      var self = this;
      var domain = {
        name: 'MyDomain',
        company_name: 'open-paas.org',
        administrator: user._id
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
          user.joinDomain(domain, callback);
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
          self.helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
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
      var self = this;
      var domain = {
        name: 'MyDomain',
        company_name: 'open-paas.org',
        administrator: user._id
      };

      var title = 'test1';
      var titleWithUpperCase = 'TesT1';

      async.series([
          function(callback) {
            saveDomain(domain, callback);
          },
          function(callback) {
            user.joinDomain(domain, callback);
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
            self.helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
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
      var self = this;
      var domain = {
        name: 'MyDomain',
        company_name: 'open-paas.org',
        administrator: user._id
      };

      var user2 = new User({password: 'pwd', emails: ['user2@linagora.com']});
      var title = 'C1';

      async.series([
          function(callback) {
            saveUser(user2, callback);
          },
          function(callback) {
            saveDomain(domain, callback);
          },
          function(callback) {
            user.joinDomain(domain, callback);
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
            self.helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
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

    describe('membershipRequests', function() {

      beforeEach(function(done) {
        var self = this;
        this.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
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

          self.helpers.api.createCommunity('Node', self.user, self.domain, {membershipRequests: [self.membershipRequest]},
                                           function(err, saved) {
            if (err) { return done(err); }
            self.community = saved;
            done();
          });
        });
      });


      it('should return the membershipRequest date', function(done) {

        var self = this;
        this.helpers.api.loginAsUser(webserver.application, this.user2.emails[0], 'secret', function(err, loggedInAsUser) {

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
      request(webserver.application).post('/api/communities').expect(401).end(function(err, res) {
        expect(err).to.be.null;
        done();
      });
    });

    it('should not create the community when user is not domain member', function(done) {
      var self = this;
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
          self.helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
            if (err) {
              return done(err);
            }
            var req = loggedInAsUser(request(webserver.application).post('/api/communities'));
            req.send(community);
            req.expect(403);
            req.end(function(err, res) {
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
      var self = this;
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
          domain.administrator = user._id;
          saveDomain(domain, callback);
        },
        function() {
          community.domain_ids = [domain._id];

          self.helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
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
              expect(res.body.creator).to.equal(user._id + '');
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
                expect(result[0].creator + '').to.equal(user._id + '');
                expect(result[0].members[0].member.id + '').to.equal(user._id + '');
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
      var self = this;
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
          domain.administrator = user._id;
          saveDomain(domain, callback);
        },
        function(callback) {
          saveCommunity(community, callback);
        },
        function() {
          self.helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
            if (err) {
              return done(err);
            }
            var req = loggedInAsUser(request(webserver.application).post('/api/communities'));
            req.send(community);
            req.expect(400);
            req.end(function(err, res) {
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
  });

  describe('GET /api/communities/:id', function() {

    it('should send back 401 when not logged in', function(done) {
      var community = {_id: 123};
      request(webserver.application).get('/api/communities/' + community._id).expect(401).end(function(err, res) {
        expect(err).to.be.null;
        done();
      });
    });

    it('should get 404 if community does not exist', function(done) {
      var ObjectId = require('bson').ObjectId;
      var id = new ObjectId();
      this.helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(webserver.application).get('/api/communities/' + id));
        req.expect(404);
        req.end(function(err, res) {
          expect(err).to.be.null;
          done();
        });
      });
    });

    it('should get the community information even if the user is not a community member', function(done) {
      var self = this;
      var community = {
        title: 'Node.js',
        description: 'This is the community description'
      };
      var domain = {
        name: 'MyDomain',
        company_name: 'MyAwesomeCompany'
      };
      var foouser = {emails: ['foo@bar.com'], password: 'secret'};

      async.series([
        function(callback) {
          saveUser(foouser, callback);
        },
        function(callback) {
          domain.administrator = foouser._id;
          saveDomain(domain, callback);
        },
        function(callback) {
          community.creator = foouser._id;
          community.domain_ids = [domain._id];
          saveCommunity(community, callback);
        },
        function() {
          self.helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
            if (err) {
              return done(err);
            }
            var req = loggedInAsUser(request(webserver.application).get('/api/communities/' + community._id));
            req.expect(200);
            req.end(function(err, res) {
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
      var self = this;
      var community = {
        title: 'Node.js',
        description: 'This is the community description'
      };
      var domain = {
        name: 'MyDomain',
        company_name: 'MyAwesomeCompany'
      };
      var foouser = {emails: ['foo@bar.com'], password: 'secret'};

      async.series([
        function(callback) {
          saveUser(foouser, callback);
        },
        function(callback) {
          domain.administrator = user._id;
          saveDomain(domain, callback);
        },
        function(callback) {
          community.creator = foouser._id;
          community.domain_ids = [domain._id];
          saveCommunity(community, callback);
        },
        function() {
          self.helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
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
      var self = this;
      this.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
        if (err) {
          return done(err);
        }
        self.helpers.api.loginAsUser(webserver.application, models.users[0].emails[0], 'secret', function(err, loggedInAsUser) {
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
      var self = this;
      this.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
        if (err) {
          return done(err);
        }
        self.helpers.api.loginAsUser(webserver.application, models.users[0].emails[0], 'secret', function(err, loggedInAsUser) {
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
      var community = {_id: 123};
      request(webserver.application).get('/api/communities/' + community._id + '/avatar').expect(401).end(function(err, res) {
        expect(err).to.be.null;
        done();
      });
    });
  });

  describe('POST /api/communities/:id/avatar', function() {
    it('should send back 401 when not logged in', function(done) {
      var community = {_id: 123};
      request(webserver.application).post('/api/communities/' + community._id + '/avatar').expect(401).end(function(err, res) {
        expect(err).to.be.null;
        done();
      });
    });
  });

  describe('DELETE /api/communities/:id', function() {
    it('should send back 401 when not logged in', function(done) {
      var community = {_id: 123};
      request(webserver.application).del('/api/communities/' + community._id).expect(401).end(function(err, res) {
        expect(err).to.be.null;
        done();
      });
    });
  });

  describe('GET /api/communities/:id/members', function() {

    it('should return 401 if user is not authenticated', function(done) {
      request(webserver.application).get('/api/communities/123/members').expect(401).end(function(err, res) {
        expect(err).to.be.null;
        done();
      });
    });

    describe('access rights', function() {
      beforeEach(function(done) {
        var self = this;
        var user, domain;
        this.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
          if (err) { return done(err); }
          self.models = models;
          domain = models.domain;
          user = models.users[0];
          var member = {member: {id: models.users[1]._id, objectType: 'user'}};
          function patchCommunity(type) {
            return function(json) {
              json.type = type;
              json.members.push(member);
              return json;
            };
          }


          async.series([
            function(callback) {
              self.helpers.api.createCommunity('Open', user, domain, patchCommunity('open'), callback);
            },
            function(callback) {
              self.helpers.api.createCommunity('Restricted', user, domain, patchCommunity('restricted'), callback);
            },
            function(callback) {
              self.helpers.api.createCommunity('Private', user, domain, patchCommunity('private'), callback);
            },
            function(callback) {
              self.helpers.api.createCommunity('Confidential', user, domain, patchCommunity('confidential'), callback);
            }
          ], function(err, communities) {
            if (err) { return done(err); }
            self.communities = communities;
            done();
          });
        });
      });

      describe('open communities', function() {
        beforeEach(function() {
          this.com = this.communities[0][0];
          this.creator = this.models.users[0].emails[0];
          this.member = this.models.users[1].emails[0];
          this.nonMember = this.models.users[2].emails[0];
        });
        it('should return 200 if user is not a member', function(done) {
          var self = this;
          this.helpers.api.loginAsUser(webserver.application, this.nonMember, 'secret', function(err, loggedInAsUser) {
            if (err) { return done(err); }
            var req = loggedInAsUser(request(webserver.application).get('/api/communities/' + self.com._id + '/members'));
            req.expect(200);
            req.end(function(err, res) {
              expect(err).to.not.exist;
              done();
            });
          });
        });
        it('should return 200 if user is a member', function(done) {
          var self = this;
          this.helpers.api.loginAsUser(webserver.application, this.member, 'secret', function(err, loggedInAsUser) {
            if (err) { return done(err); }
            var req = loggedInAsUser(request(webserver.application).get('/api/communities/' + self.com._id + '/members'));
            req.expect(200);
            req.end(function(err, res) {
              expect(err).to.not.exist;
              done();
            });
          });
        });
      });
      describe('restricted communities', function() {
        beforeEach(function() {
          this.com = this.communities[1][0];
          this.creator = this.models.users[0].emails[0];
          this.member = this.models.users[1].emails[0];
          this.nonMember = this.models.users[2].emails[0];
        });
        it('should return 200 if user is not a member', function(done) {
          var self = this;
          this.helpers.api.loginAsUser(webserver.application, this.nonMember, 'secret', function(err, loggedInAsUser) {
            if (err) { return done(err); }
            var req = loggedInAsUser(request(webserver.application).get('/api/communities/' + self.com._id + '/members'));
            req.expect(200);
            req.end(function(err, res) {
              expect(err).to.not.exist;
              done();
            });
          });
        });
        it('should return 200 if user is a member', function(done) {
          var self = this;
          this.helpers.api.loginAsUser(webserver.application, this.member, 'secret', function(err, loggedInAsUser) {
            if (err) { return done(err); }
            var req = loggedInAsUser(request(webserver.application).get('/api/communities/' + self.com._id + '/members'));
            req.expect(200);
            req.end(function(err, res) {
              expect(err).to.not.exist;
              done();
            });
          });
        });
      });
      describe('private communities', function() {
        beforeEach(function() {
          this.com = this.communities[2][0];
          this.creator = this.models.users[0].emails[0];
          this.member = this.models.users[1].emails[0];
          this.nonMember = this.models.users[2].emails[0];
        });
        it('should return 403 if user is not a member', function(done) {
          var self = this;
          this.helpers.api.loginAsUser(webserver.application, this.nonMember, 'secret', function(err, loggedInAsUser) {
            if (err) { return done(err); }
            var req = loggedInAsUser(request(webserver.application).get('/api/communities/' + self.com._id + '/members'));
            req.expect(403);
            req.end(function(err, res) {
              expect(err).to.not.exist;
              done();
            });
          });
        });
        it('should return 200 if user is a member', function(done) {
          var self = this;
          this.helpers.api.loginAsUser(webserver.application, this.member, 'secret', function(err, loggedInAsUser) {
            if (err) { return done(err); }
            var req = loggedInAsUser(request(webserver.application).get('/api/communities/' + self.com._id + '/members'));
            req.expect(200);
            req.end(function(err, res) {
              expect(err).to.not.exist;
              done();
            });
          });
        });
      });
      describe('confidential communities', function() {
        beforeEach(function() {
          this.com = this.communities[3][0];
          this.creator = this.models.users[0].emails[0];
          this.member = this.models.users[1].emails[0];
          this.nonMember = this.models.users[2].emails[0];
        });
        it('should return 403 if user is not a member', function(done) {
          var self = this;
          this.helpers.api.loginAsUser(webserver.application, this.nonMember, 'secret', function(err, loggedInAsUser) {
            if (err) { return done(err); }
            var req = loggedInAsUser(request(webserver.application).get('/api/communities/' + self.com._id + '/members'));
            req.expect(403);
            req.end(function(err, res) {
              expect(err).to.not.exist;
              done();
            });
          });
        });
        it('should return 200 if user is a member', function(done) {
          var self = this;
          this.helpers.api.loginAsUser(webserver.application, this.member, 'secret', function(err, loggedInAsUser) {
            if (err) { return done(err); }
            var req = loggedInAsUser(request(webserver.application).get('/api/communities/' + self.com._id + '/members'));
            req.expect(200);
            req.end(function(err, res) {
              expect(err).to.not.exist;
              done();
            });
          });
        });
      });
    });

    it('should return 404 if community does not exist', function(done) {
      var ObjectId = require('bson').ObjectId;
      var id = new ObjectId();

      this.helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(webserver.application).get('/api/communities/' + id + '/members'));
        req.expect(404);
        req.end(function(err, res) {
          expect(err).to.not.exist;
          done();
        });
      });
    });

    it('should return the members list', function(done) {
      var self = this;
      this.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
        if (err) { return done(err); }
        self.helpers.api.loginAsUser(webserver.application, models.users[0].emails[0], 'secret', function(err, loggedInAsUser) {
          if (err) { return done(err); }
          var req = loggedInAsUser(request(webserver.application).get('/api/communities/' + models.communities[0]._id + '/members'));
          req.expect(200);
          req.end(function(err, res) {
            expect(err).to.not.exist;
            expect(res.body).to.be.an.array;
            expect(res.body.length).to.equal(2);
            expect(res.body[0].user).to.exist;
            expect(res.body[0].user._id).to.exist;
            expect(res.body[0].user.password).to.not.exist;
            expect(res.body[0].metadata).to.exist;
            done();
          });
        });
      });
    });

    it('should return the sliced members list', function(done) {
      var self = this;
      this.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
        if (err) { return done(err); }
        models.communities[0].members.push({member: {id: self.mongoose.Types.ObjectId(), objectType: 'user'}});
        models.communities[0].members.push({member: {id: self.mongoose.Types.ObjectId(), objectType: 'user'}});
        models.communities[0].members.push({member: {id: self.mongoose.Types.ObjectId(), objectType: 'user'}});
        models.communities[0].members.push({member: {id: self.mongoose.Types.ObjectId(), objectType: 'user'}});
        models.communities[0].save(function(err, community) {
          self.helpers.api.loginAsUser(webserver.application, models.users[0].emails[0], 'secret', function(err, loggedInAsUser) {
            if (err) { return done(err); }
            var req = loggedInAsUser(request(webserver.application).get('/api/communities/' + models.communities[0]._id + '/members'));
            req.query({limit: 3, offset: 1});
            req.expect(200);
            req.end(function(err, res) {
              expect(err).to.not.exist;
              expect(res.body).to.be.an.array;
              expect(res.body.length).to.equal(3);
              done();
            });
          });
        });
      });
    });

    it('should return number of community members in the header', function(done) {
      var self = this;
      this.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
        if (err) { return done(err); }
        models.communities[0].members.push({member: {id: self.mongoose.Types.ObjectId(), objectType: 'user'}});
        models.communities[0].members.push({member: {id: self.mongoose.Types.ObjectId(), objectType: 'user'}});
        models.communities[0].members.push({member: {id: self.mongoose.Types.ObjectId(), objectType: 'user'}});
        models.communities[0].members.push({member: {id: self.mongoose.Types.ObjectId(), objectType: 'user'}});
        models.communities[0].save(function(err, community) {
          self.helpers.api.loginAsUser(webserver.application, models.users[0].emails[0], 'secret', function(err, loggedInAsUser) {
            if (err) { return done(err); }
            var req = loggedInAsUser(request(webserver.application).get('/api/communities/' + models.communities[0]._id + '/members'));
            req.query({limit: 3, offset: 1});
            req.expect(200);
            req.end(function(err, res) {
              expect(err).to.not.exist;
              expect(res.headers['x-esn-items-count']).to.equal('6');
              done();
            });
          });
        });
      });
    });
  });

  describe('DELETE /api/communities/:id/members/:user_id', function() {

    it('should return 401 if user is not authenticated', function(done) {
      var community = {_id: 123};
      request(webserver.application). delete('/api/communities/' + community._id + '/members/123').expect(401).end(function(err, res) {
        expect(err).to.be.null;
        done();
      });
    });

    it('should return 404 if community does not exist', function(done) {
      var ObjectId = require('bson').ObjectId;
      var id = new ObjectId();
      this.helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(webserver.application). delete('/api/communities/' + id + '/members/123'));
        req.expect(404);
        req.end(function(err) {
          expect(err).to.be.null;
          done();
        });
      });
    });

    it('should return 403 if current user is the community creator', function(done) {
      var self = this;
      this.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
        if (err) { return done(err); }
        var manager = models.users[0];
        var community = models.communities[1];

        self.helpers.api.loginAsUser(webserver.application, manager.emails[0], 'secret', function(err, loggedInAsUser) {
          if (err) {
            return done(err);
          }
          var req = loggedInAsUser(request(webserver.application). delete('/api/communities/' + community._id + '/members/' + manager._id));
          req.expect(403);
          req.end(function(err) {
            expect(err).to.not.exist;
            done();
          });
        });
      });
    });

    it('should remove the current user from members if already in', function(done) {
      var self = this;
      this.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
        if (err) { return done(err); }
        var manager = models.users[0];
        var community = models.communities[1];

        self.helpers.api.loginAsUser(webserver.application, models.users[1].emails[0], 'secret', function(err, loggedInAsUser) {
          if (err) {
            return done(err);
          }
          var req = loggedInAsUser(request(webserver.application). delete('/api/communities/' + community._id + '/members/' + models.users[1]._id));
          req.expect(204);
          req.end(function(err, res) {
            expect(err).to.not.exist;
            Community.find({_id: community._id}, function(err, document) {
              if (err) {
                return done(err);
              }
              expect(document[0].members.length).to.equal(1);
              expect(document[0].members[0].member.id + '').to.equal('' + manager._id);
              done();
            });
          });
        });
      });
    });
  });

  describe('GET /api/communities/:id/members/:user_id', function() {

    it('should return 401 if user is not authenticated', function(done) {
      request(webserver.application).get('/api/communities/123/members/456').expect(401).end(function(err, res) {
        expect(err).to.be.null;
        done();
      });
    });

    it('should return 404 if community does not exist', function(done) {
      var ObjectId = require('bson').ObjectId;
      var id = new ObjectId();
      var user_id = new ObjectId();
      this.helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(webserver.application).get('/api/communities/' + id + '/members/' + user_id));
        req.expect(404);
        req.end(function(err) {
          expect(err).to.be.null;
          done();
        });
      });
    });

    describe('access rights', function() {
      beforeEach(function(done) {
        var self = this;
        var user, domain;
        this.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
          if (err) { return done(err); }
          self.models = models;
          domain = models.domain;
          user = models.users[0];
          var member = { member: {
              id: models.users[1]._id,
              objectType: 'user'
            }
          };
          function patchCommunity(type) {
            return function(json) {
              json.type = type;
              json.members.push(member);
              return json;
            };
          }


          async.series([
            function(callback) {
              self.helpers.api.createCommunity('Open', user, domain, patchCommunity('open'), callback);
            },
            function(callback) {
              self.helpers.api.createCommunity('Restricted', user, domain, patchCommunity('restricted'), callback);
            },
            function(callback) {
              self.helpers.api.createCommunity('Private', user, domain, patchCommunity('private'), callback);
            },
            function(callback) {
              self.helpers.api.createCommunity('Confidential', user, domain, patchCommunity('confidential'), callback);
            }
          ], function(err, communities) {
            if (err) { return done(err); }
            self.communities = communities;
            done();
          });
        });
      });

      describe('open communities', function() {
        beforeEach(function() {
          this.com = this.communities[0][0];
          this.creator = this.models.users[0];
          this.member = this.models.users[1].emails[0];
          this.nonMember = this.models.users[2].emails[0];
        });
        it('should return 200 if the user is not a community member', function(done) {
          var self = this;
          self.helpers.api.loginAsUser(webserver.application, self.nonMember, 'secret', function(err, loggedInAsUser) {
            if (err) { return done(err); }
            var req = loggedInAsUser(request(webserver.application).get('/api/communities/' + self.com._id + '/members/' + self.creator._id));
            req.expect(200);
            req.end(function(err, res) {
              expect(err).to.not.exist;
              done();
            });
          });
        });

        it('should return 200 if the user is a community member', function(done) {
          var self = this;
          self.helpers.api.loginAsUser(webserver.application, self.member, 'secret', function(err, loggedInAsUser) {
            if (err) { return done(err); }
            var req = loggedInAsUser(request(webserver.application).get('/api/communities/' + self.com._id + '/members/' + self.creator._id));
            req.expect(200);
            req.end(function(err, res) {
              expect(err).to.not.exist;
              done();
            });
          });
        });
      });

      describe('restricted communities', function() {
        beforeEach(function() {
          this.com = this.communities[1][0];
          this.creator = this.models.users[0];
          this.member = this.models.users[1].emails[0];
          this.nonMember = this.models.users[2].emails[0];
        });
        it('should return 200 if the user is not a community member', function(done) {
          var self = this;
          self.helpers.api.loginAsUser(webserver.application, self.nonMember, 'secret', function(err, loggedInAsUser) {
            if (err) { return done(err); }
            var req = loggedInAsUser(request(webserver.application).get('/api/communities/' + self.com._id + '/members/' + self.creator._id));
            req.expect(200);
            req.end(function(err, res) {
              expect(err).to.not.exist;
              done();
            });
          });
        });

        it('should return 200 if the user is a community member', function(done) {
          var self = this;
          self.helpers.api.loginAsUser(webserver.application, self.member, 'secret', function(err, loggedInAsUser) {
            if (err) { return done(err); }
            var req = loggedInAsUser(request(webserver.application).get('/api/communities/' + self.com._id + '/members/' + self.creator._id));
            req.expect(200);
            req.end(function(err, res) {
              expect(err).to.not.exist;
              done();
            });
          });
        });
      });

      describe('private communities', function() {
        beforeEach(function() {
          this.com = this.communities[2][0];
          this.creator = this.models.users[0];
          this.member = this.models.users[1].emails[0];
          this.nonMember = this.models.users[2].emails[0];
        });
        it('should return 403 if the user is not a community member', function(done) {
          var self = this;
          self.helpers.api.loginAsUser(webserver.application, self.nonMember, 'secret', function(err, loggedInAsUser) {
            if (err) { return done(err); }
            var req = loggedInAsUser(request(webserver.application).get('/api/communities/' + self.com._id + '/members/' + self.creator._id));
            req.expect(403);
            req.end(function(err, res) {
              expect(err).to.not.exist;
              done();
            });
          });
        });

        it('should return 200 if the user is a community member', function(done) {
          var self = this;
          self.helpers.api.loginAsUser(webserver.application, self.member, 'secret', function(err, loggedInAsUser) {
            if (err) { return done(err); }
            var req = loggedInAsUser(request(webserver.application).get('/api/communities/' + self.com._id + '/members/' + self.creator._id));
            req.expect(200);
            req.end(function(err, res) {
              expect(err).to.not.exist;
              done();
            });
          });
        });
      });

      describe('confidential communities', function() {
        beforeEach(function() {
          this.com = this.communities[3][0];
          this.creator = this.models.users[0];
          this.member = this.models.users[1].emails[0];
          this.nonMember = this.models.users[2].emails[0];
        });
        it('should return 403 if the user is not a community member', function(done) {
          var self = this;
          self.helpers.api.loginAsUser(webserver.application, self.nonMember, 'secret', function(err, loggedInAsUser) {
            if (err) { return done(err); }
            var req = loggedInAsUser(request(webserver.application).get('/api/communities/' + self.com._id + '/members/' + self.creator._id));
            req.expect(403);
            req.end(function(err, res) {
              expect(err).to.not.exist;
              done();
            });
          });
        });

        it('should return 200 if the user is a community member', function(done) {
          var self = this;
          self.helpers.api.loginAsUser(webserver.application, self.member, 'secret', function(err, loggedInAsUser) {
            if (err) { return done(err); }
            var req = loggedInAsUser(request(webserver.application).get('/api/communities/' + self.com._id + '/members/' + self.creator._id));
            req.expect(200);
            req.end(function(err, res) {
              expect(err).to.not.exist;
              done();
            });
          });
        });
      });
    });

    it('should return 200 if current user and input user is a community member', function(done) {
      var self = this;
      this.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
        if (err) { return done(err); }
        var community = models.communities[0];

        self.helpers.api.loginAsUser(webserver.application, models.users[1].emails[0], 'secret', function(err, loggedInAsUser) {
          if (err) {
            return done(err);
          }
          var req = loggedInAsUser(request(webserver.application).get('/api/communities/' + community._id + '/members/' + models.users[0]._id));
          req.expect(200);
          req.end(function(err, res) {
            expect(err).to.not.exist;
            done();
          });
        });
      });
    });
  });

  describe('DELETE /api/communities/:id/membership/:user_id', function() {

    beforeEach(function(done) {
      var self = this;
      this.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
        if (err) { done(err); }
        self.domain = models.domain;
        self.admin = models.users[0];
        self.jdoe = models.users[1];
        self.jdee = models.users[1];
        self.kcobain = models.users[2];
        self.jhendrix = models.users[3];
        self.membershipRequests = [{
          user: self.jdee._id,
          workflow: 'invitation',
          timestamp: {
            creation: new Date(1419509532000)
          }
        },
        {
          user: self.kcobain._id,
          workflow: 'request',
          timestamp: {
            creation: new Date(1419509532000)
          }
        }];

        self.helpers.api.createCommunity(
          'Node',
          self.admin,
          self.domain,
          {membershipRequests: self.membershipRequests, type: 'restricted'},
          function(err, saved) {
            if (err) { return done(err); }
            self.community = saved;
            done();
          }
        );
      });
    });

    it('should return 401 if user is not authenticated', function(done) {
      request(webserver.application). delete('/api/communities/123/membership/456').expect(401).end(function(err) {
        expect(err).to.be.null;
        done();
      });
    });

    describe('when current user is not community manager', function() {

      it('should return 403 if current user is not the target user', function(done) {
        var self = this;
        self.helpers.api.loginAsUser(webserver.application, self.jhendrix.emails[0], 'secret', function(err, loggedInAsUser) {
          if (err) {
            return done(err);
          }
          var req = loggedInAsUser(
            request(webserver.application). delete('/api/communities/' + self.community._id + '/membership/' + self.jdee._id)
          );
          req.end(function(err, res) {
            expect(res.status).to.equal(403);
            expect(res.text).to.match(/Current user is not the target user/);
            done();
          });
        });
      });

      it('should return 204 with the community having no more membership requests', function(done) {
        var self = this;
        self.community.membershipRequests = [];
        self.community.save(function(err, community) {
          if (err) { return done(err); }
          self.helpers.api.loginAsUser(webserver.application, self.jhendrix.emails[0], 'secret', function(err, loggedInAsUser) {
            if (err) { return done(err); }
            var req = loggedInAsUser(
              request(webserver.application). delete('/api/communities/' + self.community._id + '/membership/' + self.jhendrix._id)
            );
            req.end(function(err, res) {
              expect(res.status).to.equal(204);
              done();
            });
          });
        });
      });

      it('should return 204 even if the community had no membership request for this user', function(done) {
        var self = this;
        self.helpers.api.loginAsUser(webserver.application, self.jhendrix.emails[0], 'secret', function(err, loggedInAsUser) {
          if (err) { return done(err); }
          var req = loggedInAsUser(
            request(webserver.application). delete('/api/communities/' + self.community._id + '/membership/' + self.jhendrix._id)
          );
          req.end(function(err, res) {
            expect(res.status).to.equal(204);
            done();
          });
        });
      });

      describe('when the workflow is invitation', function() {
        it('should return 204 and remove the membershipRequest of the community', function(done) {
          var self = this;
          self.helpers.api.loginAsUser(webserver.application, self.jdee.emails[0], 'secret', function(err, loggedInAsUser) {
            if (err) { return done(err); }
            var req = loggedInAsUser(
              request(webserver.application). delete('/api/communities/' + self.community._id + '/membership/' + self.jdee._id)
            );
            req.end(function(err, res) {
              expect(res.status).to.equal(204);
              self.helpers.api.getCommunity(self.community._id, function(err, community)  {
                if (err) {return done(err);}
                var requests = community.membershipRequests.filter(function(mr) {
                  return mr.user.equals(self.jdee._id);
                });
                expect(requests).to.have.length(0);
                done();
              });
            });
          });
        });

        it('should publish a message in community:membership:invitation:decline topic', function(done) {
          var self = this;
          var pubsub = require(this.testEnv.basePath + '/backend/core').pubsub.local,
          topic = pubsub.topic('community:membership:invitation:decline');
          topic.subscribe(function(message) {
            expect(self.jdee._id.equals(message.author)).to.be.true;
            expect(self.community._id.equals(message.target)).to.be.true;
            expect(self.community._id.equals(message.community)).to.be.true;
            done();
          });

          self.helpers.api.loginAsUser(webserver.application, self.jdee.emails[0], 'secret', function(err, loggedInAsUser) {
            if (err) { return done(err); }
            var req = loggedInAsUser(
              request(webserver.application). delete('/api/communities/' + self.community._id + '/membership/' + self.jdee._id)
            );
            req.end(function(err, res) {
              expect(res.status).to.equal(204);
            });
          });
        });

      });

      describe('when the workflow is request', function() {
        it('should return 204 and remove the membershipRequest of the community', function(done) {
          var self = this;
          self.helpers.api.loginAsUser(webserver.application, self.kcobain.emails[0], 'secret', function(err, loggedInAsUser) {
            if (err) { return done(err); }
            var req = loggedInAsUser(
              request(webserver.application). delete('/api/communities/' + self.community._id + '/membership/' + self.kcobain._id)
            );
            req.end(function(err, res) {
              expect(res.status).to.equal(204);
              self.helpers.api.getCommunity(self.community._id, function(err, community)  {
                if (err) {return done(err);}
                var requests = community.membershipRequests.filter(function(mr) {
                  return mr.user.equals(self.kcobain._id);
                });
                expect(requests).to.have.length(0);
                done();
              });
            });
          });
        });

        it('should publish a message in community:membership:request:cancel topic', function(done) {
          var self = this;
          var pubsub = require(this.testEnv.basePath + '/backend/core').pubsub.local,
          topic = pubsub.topic('community:membership:request:cancel');
          topic.subscribe(function(message) {
            expect(self.kcobain._id.equals(message.author)).to.be.true;
            expect(self.community._id.equals(message.target)).to.be.true;
            expect(self.community._id.equals(message.community)).to.be.true;
            done();
          });

          self.helpers.api.loginAsUser(webserver.application, self.kcobain.emails[0], 'secret', function(err, loggedInAsUser) {
            if (err) { return done(err); }
            var req = loggedInAsUser(
              request(webserver.application). delete('/api/communities/' + self.community._id + '/membership/' + self.kcobain._id)
            );
            req.end(function(err, res) {
              expect(res.status).to.equal(204);
            });
          });
        });
      });

    });

    describe('when current user is community manager', function() {

      describe('and target user does not have membershipRequests', function() {
        it('should return 204, and let the membershipRequests array unchanged', function(done) {
          var self = this;
          self.helpers.api.loginAsUser(webserver.application, self.admin.emails[0], 'secret', function(err, loggedInAsUser) {
            if (err) { return done(err); }
            var req = loggedInAsUser(
              request(webserver.application). delete('/api/communities/' + self.community._id + '/membership/' + self.jhendrix._id)
            );
            req.end(function(err, res) {
              expect(res.status).to.equal(204);
              self.helpers.api.getCommunity(self.community._id, function(err, community)  {
                if (err) {return done(err);}
                expect(community.membershipRequests).to.have.length(2);
                done();
              });
            });
          });
        });
      });

      describe('and workflow = invitation', function() {

        it('should return 204 and remove the membershipRequest of the community', function(done) {
          var self = this;
          self.helpers.api.loginAsUser(webserver.application, self.admin.emails[0], 'secret', function(err, loggedInAsUser) {
            if (err) { return done(err); }
            var req = loggedInAsUser(
              request(webserver.application). delete('/api/communities/' + self.community._id + '/membership/' + self.jdee._id)
            );
            req.end(function(err, res) {
              expect(res.status).to.equal(204);
              self.helpers.api.getCommunity(self.community._id, function(err, community)  {
                if (err) {return done(err);}
                var requests = community.membershipRequests.filter(function(mr) {
                  return mr.user.equals(self.jdee._id);
                });
                expect(requests).to.have.length(0);
                done();
              });
            });
          });
        });

        it('should publish a message in community:membership:invitation:cancel topic', function(done) {
          var self = this;
          var pubsub = require(this.testEnv.basePath + '/backend/core').pubsub.local,
          topic = pubsub.topic('community:membership:invitation:cancel');
          topic.subscribe(function(message) {
            expect(self.admin._id.equals(message.author)).to.be.true;
            expect(self.jdee._id.equals(message.target)).to.be.true;
            expect(self.community._id.equals(message.community)).to.be.true;
            done();
          });

          self.helpers.api.loginAsUser(webserver.application, self.admin.emails[0], 'secret', function(err, loggedInAsUser) {
            if (err) { return done(err); }
            var req = loggedInAsUser(
              request(webserver.application). delete('/api/communities/' + self.community._id + '/membership/' + self.jdee._id)
            );
            req.end(function(err, res) {
              expect(res.status).to.equal(204);
            });
          });
        });

      });

      describe('and workflow = request', function() {

        it('should return 204 and remove the membershipRequest of the community', function(done) {
          var self = this;
          self.helpers.api.loginAsUser(webserver.application, self.admin.emails[0], 'secret', function(err, loggedInAsUser) {
            if (err) { return done(err); }
            var req = loggedInAsUser(
              request(webserver.application). delete('/api/communities/' + self.community._id + '/membership/' + self.kcobain._id)
            );
            req.end(function(err, res) {
              expect(res.status).to.equal(204);
              self.helpers.api.getCommunity(self.community._id, function(err, community)  {
                if (err) {return done(err);}
                var requests = community.membershipRequests.filter(function(mr) {
                  return mr.user.equals(self.kcobain._id);
                });
                expect(requests).to.have.length(0);
                done();
              });
            });
          });
        });

        it('should publish a message in community:membership:request:refuse topic', function(done) {
          var self = this;
          var pubsub = require(this.testEnv.basePath + '/backend/core').pubsub.local,
          topic = pubsub.topic('community:membership:request:refuse');
          topic.subscribe(function(message) {
            expect(self.admin._id.equals(message.author)).to.be.true;
            expect(self.kcobain._id.equals(message.target)).to.be.true;
            expect(self.community._id.equals(message.community)).to.be.true;
            done();
          });

          self.helpers.api.loginAsUser(webserver.application, self.admin.emails[0], 'secret', function(err, loggedInAsUser) {
            if (err) { return done(err); }
            var req = loggedInAsUser(
              request(webserver.application). delete('/api/communities/' + self.community._id + '/membership/' + self.kcobain._id)
            );
            req.end(function(err, res) {
              expect(res.status).to.equal(204);
            });
          });
        });

      });

    });

    // TODO Move those tests when DELETE /api/collaborations is done
    describe.skip('pubsub events', function() {
      beforeEach(function(done) {
        var self = this;
        self.helpers.api.loginAsUser(webserver.application, self.admin.emails[0], 'secret', function(err, loggedInAsUser) {
          self.loggedInAsManager = loggedInAsUser;
          self.helpers.api.loginAsUser(webserver.application, self.jhendrix.emails[0], 'secret', function(err, loggedInAsUser) {
            self.loggedInAsUser = loggedInAsUser;
            done();
          });
        });
      });

      describe('when admin refuses a join request', function() {
        it('should add a usernotification for the user', function(done) {
          var self = this;
          var mongoose = require('mongoose');
          var maxtries = 10, currenttry = 0;

          function checkusernotificationexists() {
            if (currenttry === maxtries) {
              return done(new Error('Unable to find user notification after 10 tries'));
            }
            currenttry++;

            var UN = mongoose.model('Usernotification');
            UN.find(
              {
                category: 'community:membership:refused',
                target: self.jhendrix._id
              },
              function(err, notifs) {
                if (err) { return done(err); }
                if (!notifs.length) {
                  checkusernotificationexists();
                  return;
                }
                return done(null, notifs[0]);
              }
            );
          }


          var req = self.loggedInAsUser(
            request(webserver.application)
              .put('/api/collaboration/community/' + self.community._id + '/membership/' + self.jhendrix._id)
          );
          req.end(function(err, res) {
            var req = self.loggedInAsManager(
              request(webserver.application)
                . delete('/api/communities/' + self.community._id + '/membership/' + self.jhendrix._id)
            );
            req.end(function(err, res) {
              expect(res.status).to.equal(204);
              checkusernotificationexists();
            });
          });
        });
      });

      describe('when manager cancels an invitation', function() {

        it('should remove the attendee usernotification', function(done) {
          var self = this;
          var mongoose = require('mongoose');
          var maxtries = 10, currenttry = 0;

          function checkusernotificationexists(callback) {
            if (currenttry === maxtries) {
              return callback(new Error('Unable to find user notification after 10 tries'));
            }
            currenttry++;

            var UN = mongoose.model('Usernotification');
            UN.find(
              {
                category: 'community:membership:invite',
                target: self.jhendrix._id
              },
              function(err, notifs) {
                if (err) { return callback(err); }
                if (!notifs.length) {
                  checkusernotificationexists(callback);
                  return;
                }
                return callback(null, notifs[0]);
              }
            );
          }

          function checkusernotificationdisappear() {
            if (currenttry === maxtries) {
              return done(new Error('Still finding user notification after 10 tries'));
            }
            currenttry++;

            var UN = mongoose.model('Usernotification');
            UN.find(
              {
                category: 'community:membership:invite',
                target: self.jhendrix._id
              },
              function(err, notifs) {
                if (err) { return done(err); }
                if (notifs.length) {
                  checkusernotificationdisappear();
                  return;
                }
                return done();
              }
            );
          }

          var req = self.loggedInAsManager(
            request(webserver.application)
              .put('/api/communities/' + self.community._id + '/membership/' + self.jhendrix._id)
          );
          req.end(function(err, res) {
            checkusernotificationexists(function(err, notif) {
              if (err) { return done(err); }
              var req = self.loggedInAsManager(
                request(webserver.application)
                  . delete('/api/communities/' + self.community._id + '/membership/' + self.jhendrix._id)
              );
              req.end(function(err, res) {
                expect(res.status).to.equal(204);
                currenttry = 0;
                checkusernotificationdisappear();
              });
            });
          });
        });
      });
    });

  });

});
