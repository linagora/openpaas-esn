'use strict';

var expect = require('chai').expect;
var request = require('supertest');
var async = require('async');

describe('The communities API', function() {

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
      webserver = require(self.testEnv.basePath + '/backend/webserver');

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
        company_name: 'MyAwesomeCompany',
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
        company_name: 'MyAwesomeCompany',
        administrator: user._id
      };

      var title = 'test1';
      var titleWithUpperCase = 'TesT1';

      async.series([
          function(callback) {
            saveDomain(domain, callback);
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
        company_name: 'MyAwesomeCompany',
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
            }
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
            expect(res.body.length).to.equal(1);
            expect(res.body[0]).to.have.property('membershipRequest');
            expect(res.body[0].membershipRequest).to.equal(1419509532000);
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
                expect(result[0].members[0].user + '').to.equal(user._id + '');
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
      var community = {
        title: 'Node.js',
        description: 'This is the community description',
        status: 'open',
        members: []
      };
      var domain = {
        name: 'MyDomain',
        company_name: 'MyAwesomeCompany'
      };
      var foouser = {emails: ['foo@bar.com'], password: 'secret'};
      var baruser = {emails: ['bar@bar.com'], password: 'secret'};
      var bazuser = {emails: ['baz@bar.com'], password: 'secret'};

      async.series([
        function(callback) {
          saveUser(foouser, callback);
        },
        function(callback) {
          saveUser(baruser, callback);
        },
        function(callback) {
          saveUser(bazuser, callback);
        },
        function(callback) {
          domain.administrator = foouser._id;
          saveDomain(domain, callback);
        },
        function(callback) {
          community.creator = foouser._id;
          community.domain_ids = [domain._id];
          community.type = 'open';
          community.members.push({user: foouser._id});
          community.members.push({user: baruser._id});
          community.members.push({user: bazuser._id});
          saveCommunity(community, callback);
        },
        function() {
          self.helpers.api.loginAsUser(webserver.application, foouser.emails[0], password, function(err, loggedInAsUser) {
            if (err) {
              return done(err);
            }
            var req = loggedInAsUser(request(webserver.application).get('/api/communities/' + community._id));
            req.expect(200);
            req.end(function(err, res) {
              expect(err).to.not.exist;
              expect(res.body.exist);
              expect(res.body.members_count).to.exist;
              expect(res.body.members_count).to.equal(3);
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

    it('should return "member" in member_status if current user is member of the community', function(done) {
      var self = this;
      var community = {
        title: 'Node.js',
        description: 'This is the community description',
        status: 'open',
        members: []
      };
      var domain = {
        name: 'MyDomain',
        company_name: 'MyAwesomeCompany'
      };
      var foouser = {emails: ['foo@bar.com'], password: 'secret'};
      var baruser = {emails: ['bar@bar.com'], password: 'secret'};
      var bazuser = {emails: ['baz@bar.com'], password: 'secret'};

      async.series([
        function(callback) {
          saveUser(foouser, callback);
        },
        function(callback) {
          saveUser(baruser, callback);
        },
        function(callback) {
          saveUser(bazuser, callback);
        },
        function(callback) {
          domain.administrator = foouser._id;
          saveDomain(domain, callback);
        },
        function(callback) {
          community.creator = foouser._id;
          community.domain_ids = [domain._id];
          community.type = 'open';
          community.members.push({user: foouser._id});
          saveCommunity(community, callback);
        },
        function() {
          self.helpers.api.loginAsUser(webserver.application, foouser.emails[0], password, function(err, loggedInAsUser) {
            if (err) {
              return done(err);
            }
            var req = loggedInAsUser(request(webserver.application).get('/api/communities/' + community._id));
            req.expect(200);
            req.end(function(err, res) {
              expect(err).to.not.exist;
              expect(res.body.exist);
              expect(res.body.member_status).to.exist;
              expect(res.body.member_status).to.equal('member');
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

    it('should return 401 is user is not authenticated', function(done) {
      request(webserver.application).get('/api/communities/123/members').expect(401).end(function(err, res) {
        expect(err).to.be.null;
        done();
      });
    });

    it('should return 403 if user is not a community member', function(done) {
      var self = this;
      var community = {
        title: 'Node.js',
        description: 'This is the community description',
        status: 'open',
        members: []
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
          community.type = 'open';
          community.members.push({user: foouser._id});
          saveCommunity(community, callback);
        },
        function() {
          self.helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
            if (err) {
              return done(err);
            }
            var req = loggedInAsUser(request(webserver.application).get('/api/communities/' + community._id + '/members'));
            req.expect(403);
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
      var community = {
        title: 'Node.js',
        description: 'This is the community description',
        status: 'open',
        members: []
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
          community.type = 'open';
          community.members.push({user: foouser._id}, {user: user._id});
          saveCommunity(community, callback);
        },
        function() {
          self.helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
            if (err) {
              return done(err);
            }
            var req = loggedInAsUser(request(webserver.application).get('/api/communities/' + community._id + '/members'));
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
        }
      ], function(err) {
        if (err) {
          return done(err);
        }
      });
    });

    it('should return the sliced members list', function(done) {
      var self = this;
      var community = {
        title: 'Node.js',
        description: 'This is the community description',
        status: 'open',
        members: []
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
          community.type = 'open';
          community.members.push({user: foouser._id}, {user: user._id}, {user: self.mongoose.Types.ObjectId()}, {user: self.mongoose.Types.ObjectId()}, {user: self.mongoose.Types.ObjectId()}, {user: self.mongoose.Types.ObjectId()}, {user: self.mongoose.Types.ObjectId()});
          saveCommunity(community, callback);
        },
        function() {
          self.helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
            if (err) {
              return done(err);
            }
            var req = loggedInAsUser(request(webserver.application).get('/api/communities/' + community._id + '/members'));
            req.query({limit: 3, offset: 1});
            req.expect(200);
            req.end(function(err, res) {
              expect(err).to.not.exist;
              expect(res.body).to.be.an.array;
              expect(res.body.length).to.equal(3);
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

    it('should return number of community members in the header', function(done) {
      var self = this;
      var community = {
        title: 'Node.js',
        description: 'This is the community description',
        status: 'open',
        members: []
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
          community.type = 'open';
          community.members.push({user: foouser._id}, {user: user._id}, {user: self.mongoose.Types.ObjectId()}, {user: self.mongoose.Types.ObjectId()});
          saveCommunity(community, callback);
        },
        function() {
          self.helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
            if (err) {
              return done(err);
            }
            var req = loggedInAsUser(request(webserver.application).get('/api/communities/' + community._id + '/members'));
            req.expect(200);
            req.end(function(err, res) {
              expect(err).to.not.exist;
              expect(res.headers['x-esn-items-count']).to.equal('4');
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
  });

  describe('PUT /api/communities/:id/members/:user_id', function() {

    it('should return 401 is user is not authenticated', function(done) {
      request(webserver.application).put('/api/communities/123/members/456').expect(401).end(function(err) {
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
        var req = loggedInAsUser(request(webserver.application).put('/api/communities/' + id + '/members/123'));
        req.expect(404);
        req.end(function(err, res) {
          expect(err).to.not.exist;
          done();
        });
      });
    });

    it('should return 403 if community is not open', function(done) {
      var self = this;
      var community = {
        title: 'Node.js',
        description: 'This is the community description',
        type: 'restricted',
        members: []
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
          community.members.push({user: foouser._id});
          saveCommunity(community, callback);
        },
        function() {
          self.helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
            if (err) {
              return done(err);
            }
            var req = loggedInAsUser(request(webserver.application).put('/api/communities/' + community._id + '/members/' + user._id));
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

    it('should return 400 if current user is not equal to :user_id param', function(done) {
      var self = this;
      var community = {
        title: 'Node.js',
        description: 'This is the community description',
        type: 'open',
        members: []
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
          community.members.push({user: foouser._id});
          saveCommunity(community, callback);
        },
        function() {
          self.helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
            if (err) {
              return done(err);
            }
            var ObjectId = require('bson').ObjectId;
            var id = new ObjectId();
            var req = loggedInAsUser(request(webserver.application).put('/api/communities/' + community._id + '/members/' + id));
            req.expect(400);
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

    it('should add the current user as member', function(done) {
      var self = this;
      var community = {
        title: 'Node.js',
        description: 'This is the community description',
        type: 'open',
        members: []
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
          community.members.push({user: foouser._id});
          saveCommunity(community, callback);
        },
        function() {
          self.helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
            if (err) {
              return done(err);
            }
            var req = loggedInAsUser(request(webserver.application).put('/api/communities/' + community._id + '/members/' + user._id));
            req.expect(204);
            req.end(function(err) {
              expect(err).to.not.exist;
              Community.find({_id: community._id, 'members.user': user._id}, function(err, document) {
                if (err) {
                  return done(err);
                }
                expect(document).to.exist;
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

    it('should not add the current user as member if already in', function(done) {
      var self = this;
      var community = {
        title: 'Node.js',
        description: 'This is the community description',
        type: 'open',
        members: []
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
          community.members.push({user: foouser._id});
          community.members.push({user: user._id});
          saveCommunity(community, callback);
        },
        function() {
          self.helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
            if (err) {
              return done(err);
            }
            var req = loggedInAsUser(request(webserver.application).put('/api/communities/' + community._id + '/members/' + user._id));
            req.expect(204);
            req.end(function(err, res) {

              Community.find({_id: community._id}, function(err, document) {
                if (err) {
                  return done(err);
                }
                expect(document[0].members.length).to.equal(2);
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
      var community = {
        title: 'Node.js',
        description: 'This is the community description',
        type: 'open',
        members: []
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
          community.creator = user._id;
          community.domain_ids = [domain._id];
          community.members.push({user: foouser._id});
          community.members.push({user: user._id});
          saveCommunity(community, callback);
        },
        function() {
          self.helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
            if (err) {
              return done(err);
            }
            var req = loggedInAsUser(request(webserver.application). delete('/api/communities/' + community._id + '/members/' + user._id));
            req.expect(403);
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

    it('should remove the current user from members if already in', function(done) {
      var self = this;
      var community = {
        title: 'Node.js',
        description: 'This is the community description',
        type: 'open',
        members: []
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
          community.members.push({user: foouser._id});
          community.members.push({user: user._id});
          saveCommunity(community, callback);
        },
        function() {
          self.helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
            if (err) {
              return done(err);
            }
            var req = loggedInAsUser(request(webserver.application). delete('/api/communities/' + community._id + '/members/' + user._id));
            req.expect(204);
            req.end(function(err, res) {
              expect(err).to.not.exist;
              Community.find({_id: community._id}, function(err, document) {
                if (err) {
                  return done(err);
                }
                expect(document[0].members.length).to.equal(1);
                expect(document[0].members[0].user + '').to.equal('' + foouser._id);
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

  describe('GET /api/communities/:id/members/:user_id', function() {

    it('should return 401 is user is not authenticated', function(done) {
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

    it('should return 403 if current user is not a community member', function(done) {
      var self = this;
      var community = {
        title: 'Node.js',
        description: 'This is the community description',
        type: 'open',
        members: []
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
          community.members.push({user: foouser._id});
          saveCommunity(community, callback);
        },
        function() {
          self.helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
            if (err) {
              return done(err);
            }
            var req = loggedInAsUser(request(webserver.application).get('/api/communities/' + community._id + '/members/' + foouser._id));
            req.expect(403);
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

    it('should return 200 if current user and input user is a community member', function(done) {
      var self = this;
      var community = {
        title: 'Node.js',
        description: 'This is the community description',
        members: [],
        type: 'open'
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
          community.members.push({user: foouser._id});
          community.members.push({user: user._id});
          saveCommunity(community, callback);
        },
        function() {
          self.helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
            if (err) {
              return done(err);
            }
            var req = loggedInAsUser(request(webserver.application).get('/api/communities/' + community._id + '/members/' + foouser._id));
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

  });

  describe('PUT /api/communities/:id/membership/:user_id', function() {

    it('should return 401 if user is not authenticated', function(done) {
      request(webserver.application).put('/api/communities/123/membership/456').expect(401).end(function(err) {
        expect(err).to.be.null;
        done();
      });
    });

    it('should return 400 if user is already member of the community', function(done) {
      var self = this;
      var community = {
        title: 'Node.js',
        description: 'This is the community description',
        members: [],
        type: 'private'
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
          community.creator = user._id;
          community.domain_ids = [domain._id];
          community.members.push({user: user._id});
          saveCommunity(community, callback);
        },
        function() {
          self.helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
            if (err) {
              return done(err);
            }
            var req = loggedInAsUser(request(webserver.application).put('/api/communities/' + community._id + '/membership/' + user._id));
            req.end(function(err, res) {
              expect(res.status).to.equal(400);
              expect(res.text).to.contain('already member');
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

    it('should return 200 if user has already made a request for this community', function(done) {
      var self = this;
      var community = {
        title: 'Node.js',
        description: 'This is the community description',
        members: [],
        type: 'private',
        membershipRequests: []
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
          community.creator = user._id;
          community.domain_ids = [domain._id];
          community.membershipRequests.push({user: user._id});
          saveCommunity(community, callback);
        },
        function() {
          self.helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
            if (err) {
              return done(err);
            }
            var req = loggedInAsUser(request(webserver.application).put('/api/communities/' + community._id + '/membership/' + user._id));
            req.end(function(err, res) {
              expect(res.status).to.equal(200);
              expect(res.body.membershipRequests).to.have.length(1);
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

    it('should return 200 with the community containing a new request', function(done) {
      var self = this;
      var community = {
        title: 'Node.js',
        description: 'This is the community description',
        members: [],
        type: 'private',
        membershipRequests: []
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
          community.creator = user._id;
          community.domain_ids = [domain._id];
          saveCommunity(community, callback);
        },
        function() {
          self.helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
            if (err) {
              return done(err);
            }
            var req = loggedInAsUser(request(webserver.application).put('/api/communities/' + community._id + '/membership/' + user._id));
            req.end(function(err, res) {
              expect(res.status).to.equal(200);

              expect(res.body).to.exist;
              expect(res.body.title).to.equal(community.title);
              expect(res.body.description).to.equal(community.description);
              expect(res.body.type).to.equal(community.type);
              expect(res.body.members).to.have.length(0);

              expect(res.body.membershipRequests).to.have.length(1);
              var newRequest = res.body.membershipRequests[0];
              expect(newRequest.user).to.equal(user._id.toString());
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

  });


  describe('DELETE /api/communities/:id/membership/:user_id', function() {

    it('should return 401 if user is not authenticated', function(done) {
      request(webserver.application). delete('/api/communities/123/membership/456').expect(401).end(function(err) {
        expect(err).to.be.null;
        done();
      });
    });

    it('should return 400 if user is already member of the community', function(done) {
      var self = this;
      var community = {
        title: 'Node.js',
        description: 'This is the community description',
        members: [],
        type: 'private'
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
          community.creator = user._id;
          community.domain_ids = [domain._id];
          community.members.push({user: user._id});
          saveCommunity(community, callback);
        },
        function() {
          self.helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
            if (err) {
              return done(err);
            }
            var req = loggedInAsUser(request(webserver.application). delete('/api/communities/' + community._id + '/membership/' + user._id));
            req.end(function(err, res) {
              expect(res.status).to.equal(400);
              expect(res.text).to.contain('already member');
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


    it('should return 200 with the community having no more membership requests', function(done) {
      var self = this;
      var community = {
        title: 'Node.js',
        description: 'This is the community description',
        members: [],
        type: 'private'
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
          community.creator = user._id;
          community.domain_ids = [domain._id];
          community.membershipRequests = [{user: user._id}];
          saveCommunity(community, callback);
        },
        function() {
          self.helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
            if (err) {
              return done(err);
            }
            var req = loggedInAsUser(request(webserver.application). delete('/api/communities/' + community._id + '/membership/' + user._id));
            req.end(function(err, res) {
              expect(res.status).to.equal(200);

              expect(res.body).to.exist;
              expect(res.body.title).to.equal(community.title);
              expect(res.body.description).to.equal(community.description);
              expect(res.body.type).to.equal(community.type);
              expect(res.body.members).to.have.length(0);

              expect(res.body.membershipRequests).to.have.length(0);
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

    it('should return 200 even if the community had no membership request for this user', function(done) {
      var self = this;
      var community = {
        title: 'Node.js',
        description: 'This is the community description',
        members: [],
        type: 'private'
      };
      var domain = {
        name: 'MyDomain',
        company_name: 'MyAwesomeCompany'
      };
      var user2 = new User({password: 'pwd', emails: ['user2@linagora.com']});

      async.series([
        function(callback) {
          saveUser(user2, callback);
        },
        function(callback) {
          domain.administrator = user._id;
          saveDomain(domain, callback);
        },
        function(callback) {
          community.creator = user._id;
          community.domain_ids = [domain._id];
          community.membershipRequests = [{user: user2._id}];
          saveCommunity(community, callback);
        },
        function() {
          self.helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
            if (err) {
              return done(err);
            }
            var req = loggedInAsUser(request(webserver.application). delete('/api/communities/' + community._id + '/membership/' + user._id));
            req.end(function(err, res) {
              expect(res.status).to.equal(200);

              expect(res.body).to.exist;
              expect(res.body.title).to.equal(community.title);
              expect(res.body.description).to.equal(community.description);
              expect(res.body.type).to.equal(community.type);
              expect(res.body.members).to.have.length(0);

              expect(res.body.membershipRequests).to.have.length(0);
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

  });
});
