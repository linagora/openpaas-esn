'use strict';
var expect = require('chai').expect;
var request = require('supertest');
var async = require('async');

describe('linagora.esn.project module', function() {
  var moduleName = 'linagora.esn.project';
  beforeEach(function(done) {
    var self = this;
    this.helpers.modules.initMidway(moduleName, function(err) {
      if (err) {
        return done(err);
      }

      async.series([
        function(callback) {
          self.helpers.elasticsearch.saveTestConfiguration(callback);
        },
        function(callback) {
          self.helpers.api.applyDomainDeployment(
            'linagora_PROJECTS',
            {
              fixtures: __dirname + '/../fixtures/deployments'
            },
            function(err, models) {
              if (err) {
                return done(err);
              }
              self.models = models;
              callback();
            }
          );
        }, function(callback) {
          self.helpers.api.applyDomainDeployment(
            'orphans',
            {
              fixtures: __dirname + '/../fixtures/deployments'
            },
            function(err, models) {
              if (err) {
                return done(err);
              }
              self.orphans = models;
              callback();
            }
          );
        }
      ], done);
    });
  });

  afterEach(function(done) {
    this.helpers.api.cleanDomainDeployment(this.models, done);
  });

  describe('GET /api/projects', function() {
    beforeEach(function() {
      var app = require('../../backend/webserver/application')(this.helpers.modules.current.lib, this.helpers.modules.current.deps);
      this.app = this.helpers.modules.getWebServer(app);
    });
    it('should send back 401 when not logged in', function(done) {
      request(this.app).get('/api/projects').expect(401).end(function(err, res) {
        expect(err).to.be.null;
        done();
      });
    });

    it('should send back 400 if domain is not defined', function(done) {
      var self = this;
      self.helpers.api.loginAsUser(this.app, self.models.users[1].emails[0], 'secret', function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(self.app).get('/api/projects'));
        req.expect(400);
        req.end(function(err, res) {
          expect(err).to.not.exist;
          done();
        });
      });
    });

    it('should return an array of projects in the given domain', function(done) {
      var self = this;
      this.helpers.api.loginAsUser(this.app, this.models.users[1].emails[0], 'secret', function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(self.app).get('/api/projects?domain_id=' + self.models.domain._id));
        req.expect(200);
        req.end(function(err, res) {
          expect(err).to.not.exist;
          expect(res.body).to.exist;
          expect(res.body).to.be.an.array;
          expect(res.body.length).to.equal(5);
          done();
        });
      });
    });
    it('should return an array of projects in the given domain matching a certain title', function(done) {
      var self = this;
      this.helpers.api.loginAsUser(this.app, this.models.users[1].emails[0], 'secret', function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(self.app).get('/api/projects?domain_id=' + self.models.domain._id + '&title=OpenPaaS%20open'));
        req.expect(200);
        req.end(function(err, res) {
          expect(err).to.not.exist;
          expect(res.body).to.exist;
          expect(res.body).to.be.an.array;
          expect(res.body.length).to.equal(1);
          expect(res.body[0].title).to.equal('OpenPaaS open');
          done();
        });
      });
    });
  });

  describe('GET /api/projects/:id', function() {
    it('should send back 401 when not logged in', function(done) {
      var app = require('../../backend/webserver/application')(this.helpers.modules.current.lib, this.helpers.modules.current.deps);
      request(app).get('/api/projects').expect(401).end(function(err, res) {
        expect(err).to.be.null;
        done();
      });
    });

    it('should send back 404 when project is not found', function(done) {
      var self = this;

      self.helpers.api.loginAsUser(this.app, this.models.users[1].emails[0], 'secret', function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var projectId = '507f1f77bcf86cd799439011';
        var req = loggedInAsUser(request(this.app).get('/api/projects/' + projectId));
        req.expect(404).end(function(err, res) {
          expect(err).to.not.exist;
          expect(res.body).to.be.an('object');
          expect(res.body.error).to.be.an('object');
          expect(res.body.error.code).to.equal(404);
          done();
        });
      }.bind(this));
    });

    it('should send back 200 with project details', function(done) {
      var self = this;

      self.helpers.api.loginAsUser(this.app, this.models.users[1].emails[0], 'secret', function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var projectId = this.models.projects[0]._id;
        var req = loggedInAsUser(request(this.app).get('/api/projects/' + projectId));
        req.expect(200).end(function(err, res) {
          expect(err).to.not.exist;
          expect(res.body).to.be.an('object');
          expect(res.body.title).to.equal('OpenPaaS open');
          done();
        });
      }.bind(this));
    });
  });

  describe('POST /api/projects', function() {
    it('should send back 401 when not logged in', function(done) {
      var app = require('../../backend/webserver/application')(this.helpers.modules.current.lib, this.helpers.modules.current.deps);
      request(app).get('/api/projects').expect(401).end(function(err, res) {
        expect(err).to.be.null;
        done();
      });
    });

    it('should send back 400 when domain id is missing', function(done) {
      var self = this;

      self.helpers.api.loginAsUser(this.app, this.models.users[1].emails[0], 'secret', function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(this.app).post('/api/projects'));
        req.send({ title: 'hello' });
        req.expect(400).end(function(err, res) {
          expect(err).to.not.exist;
          expect(res.body).to.be.an('object');
          expect(res.body.error).to.be.an('object');
          expect(res.body.error.code).to.equal(400);
          expect(res.body.error.details).to.equal('At least a domain is required');
          done();
        });
      }.bind(this));
    });

    it('should send back 400 when project title is missing', function(done) {
      var self = this;

      self.helpers.api.loginAsUser(this.app, this.models.users[1].emails[0], 'secret', function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(this.app).post('/api/projects'));
        req.send({ title: '', domain_ids: [this.models.domain._id.toString()] });
        req.expect(400).end(function(err, res) {
          expect(err).to.not.exist;
          expect(res.body).to.be.an('object');
          expect(res.body.error).to.be.an('object');
          expect(res.body.error.code).to.equal(400);
          expect(res.body.error.details).to.equal('Project title is mandatory');
          done();
        });
      }.bind(this));
    });

    it('should send back 400 when start date is invalid', function(done) {
      var self = this;

      self.helpers.api.loginAsUser(this.app, this.models.users[1].emails[0], 'secret', function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(this.app).post('/api/projects'));
        req.send({ title: 'title', domain_ids: [this.models.domain._id.toString()], startDate: 'soon' });
        req.expect(400).end(function(err, res) {
          expect(err).to.not.exist;
          expect(res.body).to.be.an('object');
          expect(res.body.error).to.be.an('object');
          expect(res.body.error.code).to.equal(400);
          expect(res.body.error.details).to.equal('Start date is invalid');
          done();
        });
      }.bind(this));
    });

    it('should send back 400 when end date is invalid', function(done) {
      var self = this;

      self.helpers.api.loginAsUser(this.app, this.models.users[1].emails[0], 'secret', function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(this.app).post('/api/projects'));
        req.send({ title: 'title', domain_ids: [this.models.domain._id.toString()], endDate: 'soon' });
        req.expect(400).end(function(err, res) {
          expect(err).to.not.exist;
          expect(res.body).to.be.an('object');
          expect(res.body.error).to.be.an('object');
          expect(res.body.error.code).to.equal(400);
          expect(res.body.error.details).to.equal('End date is invalid');
          done();
        });
      }.bind(this));
    });

    it('should send back 400 when end date is before start date', function(done) {
      var self = this;

      self.helpers.api.loginAsUser(this.app, this.models.users[1].emails[0], 'secret', function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(this.app).post('/api/projects'));
        req.send({
          title: 'title',
          domain_ids: [this.models.domain._id.toString()],
          startDate: '2002-02-02T02:02:02Z',
          endDate: '2001-01-01T01:01:01Z'
        });
        req.expect(400).end(function(err, res) {
          expect(err).to.not.exist;
          expect(res.body).to.be.an('object');
          expect(res.body.error).to.be.an('object');
          expect(res.body.error.code).to.equal(400);
          expect(res.body.error.details).to.equal('Start date is after end date');
          done();
        });
      }.bind(this));
    });

    it('should send back 201 when project is created', function(done) {
      var self = this;

      self.helpers.api.loginAsUser(this.app, this.models.users[1].emails[0], 'secret', function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(this.app).post('/api/projects'));
        req.send({title: 'a new project', domain_ids: [this.models.domain._id.toString()]});
        req.expect(201).end(function(err, res) {
          var p = res.body;
          expect(err).to.not.exist;
          expect(p).to.be.an('object');
          expect(p.title).to.equal('a new project');
          expect(p.type).to.equal('open');
          expect(p._id).to.exist;
          expect(p.creator).to.equal(this.models.users[1]._id.toString());
          expect(p.activity_stream.uuid).to.exist;
          expect(p.members.length).to.equal(1);
          expect(p.members[0].member.id).to.equal(this.models.users[1]._id.toString());
          expect(p.domain_ids.length).to.equal(1);
          expect(p.domain_ids[0]).to.equal(this.models.domain._id.toString());
          done();
        }.bind(this));
      }.bind(this));
    });

    it('should create a restricted project', function(done) {
      var self = this;

      self.helpers.api.loginAsUser(this.app, this.models.users[1].emails[0], 'secret', function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(this.app).post('/api/projects'));
        req.send({title: 'a restricted project', type: 'restricted', domain_ids: [this.models.domain._id.toString()]});
        req.expect(201).end(function(err, res) {
          var p = res.body;
          expect(err).to.not.exist;
          expect(p).to.be.an('object');
          expect(p.title).to.equal('a restricted project');
          expect(p.type).to.equal('restricted');
          expect(p._id).to.exist;
          expect(p.creator).to.equal(this.models.users[1]._id.toString());
          expect(p.activity_stream.uuid).to.exist;
          expect(p.members.length).to.equal(1);
          expect(p.members[0].member.id).to.equal(this.models.users[1]._id.toString());
          expect(p.domain_ids.length).to.equal(1);
          expect(p.domain_ids[0]).to.equal(this.models.domain._id.toString());
          done();
        }.bind(this));
      }.bind(this));
    });
  });

  describe('POST /api/projects/:id/members', function() {
    beforeEach(function() {
      var app = require('../../backend/webserver/application')(this.helpers.modules.current.lib, this.helpers.modules.current.deps);
      this.app = this.helpers.modules.getWebServer(app);
    });

    it('should HTTP 401 when not connected', function(done) {
      request(this.app).post('/api/projects/123/members').expect(401).end(done);
    });

    it('should HTTP 403 when current user is not project creator', function(done) {
      var self = this;
      this.helpers.api.loginAsUser(this.app, this.models.users[1].emails[0], 'secret', function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(self.app).post('/api/projects/' + self.models.projects[1]._id + '/members'));
        req.send({id: 123, objectType: 'community'});
        req.expect(403);
        req.end(done);
      });
    });

    it('should HTTP 404 when project not found', function(done) {
      var self = this;
      this.helpers.api.loginAsUser(this.app, this.models.users[0].emails[0], 'secret', function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var ObjectId = require('bson').ObjectId;
        var id = new ObjectId();
        var req = loggedInAsUser(request(self.app).post('/api/projects/' + id + '/members'));
        req.expect(404);
        req.end(done);
      });
    });

    it('should add member and HTTP 201', function(done) {
      var self = this;
      this.helpers.api.loginAsUser(this.app, this.models.users[0].emails[0], 'secret', function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(self.app).post('/api/projects/' + self.models.projects[1]._id + '/members'));
        req.send({
          objectType: 'community',
          id: self.models.communities[0]._id
        });
        req.expect(201);
        req.end(function(err) {
          expect(err).to.not.exist;
          process.nextTick(function() {
            var Project = require('mongoose').model('Project');
            Project.findById(self.models.projects[1]._id, function(err, project) {
              if (err) {
                return done(err);
              }
              if (!project) {
                return done(new Error());
              }
              expect(project.members.length).to.equal(2);

              var isMemberOf = project.members.filter(function(m) {
                return m.member.id + '' === self.models.communities[0]._id + '' && m.member.objectType === 'community';
              });
              expect(isMemberOf.length).to.equal(1);
              done();
            });
          });
        });
      });
    });

    it('should HTTP 400 when member id is not set', function(done) {
      var self = this;
      this.helpers.api.loginAsUser(this.app, this.models.users[0].emails[0], 'secret', function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(self.app).post('/api/projects/' + self.models.projects[1]._id + '/members'));
        req.send({
          objectType: 'community'
        });
        req.expect(400);
        req.end(done);
      });
    });

    it('should HTTP 400 when member objectType is not set', function(done) {
      var self = this;
      this.helpers.api.loginAsUser(this.app, this.models.users[0].emails[0], 'secret', function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(self.app).post('/api/projects/' + self.models.projects[1]._id + '/members'));
        req.send({
          id: '123'
        });
        req.expect(400);
        req.end(done);
      });
    });
  });

  describe('GET /api/projects/:id/invitable', function() {
    beforeEach(function() {
      var app = require('../../backend/webserver/application')(this.helpers.modules.current.lib, this.helpers.modules.current.deps);
      this.app = this.helpers.modules.getWebServer(app);
    });

    it('should 401 when not connected', function(done) {
      request(this.app).get('/api/projects/123/invitable').expect(401).end(done);
    });

    it('should 404 when project not found', function(done) {
      var self = this;
      this.helpers.api.loginAsUser(this.app, this.models.users[0].emails[0], 'secret', function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var ObjectId = require('bson').ObjectId;
        var id = new ObjectId();
        var req = loggedInAsUser(request(self.app).get('/api/projects/' + id + '/invitable'));
        req.expect(404);
        req.end(done);
      });
    });

    it('should 403 when current user is not the project creator', function(done) {
      var self = this;
      this.helpers.api.loginAsUser(this.app, this.models.users[1].emails[0], 'secret', function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(self.app).get('/api/projects/' + self.models.projects[0]._id + '/invitable'));
        req.expect(403);
        req.end(done);
      });
    });

    it('should 400 when ?domain_id parameter is not defined', function(done) {
      var self = this;
      this.helpers.api.loginAsUser(this.app, this.models.users[0].emails[0], 'secret', function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(self.app).get('/api/projects/' + self.models.projects[0]._id + '/invitable'));
        req.expect(400);
        req.end(done);
      });
    });

    it('should 404 when ?domain_id domain does not exist', function(done) {
      var self = this;
      this.helpers.api.loginAsUser(this.app, this.models.users[0].emails[0], 'secret', function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var ObjectId = require('bson').ObjectId;
        var id = new ObjectId();
        var req = loggedInAsUser(request(self.app).get('/api/projects/' + self.models.projects[0]._id + '/invitable?domain_id=' + id));
        req.expect(404);
        req.end(done);
      });
    });

    it('should 403 when current user is not member of the ?domain_id domain', function(done) {
      var self = this;
      this.helpers.api.loginAsUser(this.app, this.models.users[0].emails[0], 'secret', function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(self.app).get('/api/projects/' + self.models.projects[0]._id + '/invitable?domain_id=' + self.orphans.domain._id));
        req.expect(403);
        req.end(done);
      });
    });

    it('should 200 with the list of invitable communities matching the search terms', function(done) {

      var self = this;
      var ids = this.models.communities.map(function(community) {
        return community._id;
      });

      this.helpers.elasticsearch.checkDocumentsIndexed('communities.idx', 'communities', ids, function(err) {
        if (err) {
          console.log(err);
          return done(err);
        }

        self.helpers.api.loginAsUser(self.app, self.models.users[0].emails[0], 'secret', function(err, loggedInAsUser) {
          if (err) {
            return done(err);
          }
          var search = 'searchme';
          var req = loggedInAsUser(request(self.app).get('/api/projects/' + self.models.projects[0]._id + '/invitable?domain_id=' + self.models.domain._id + '&search=' + search));
          req.expect(200);
          req.end(function(err, res) {
            expect(err).to.not.exist;
            expect(res.body).to.exist;
            expect(res.body).to.be.an.array;
            expect(res.body.length).to.equal(2);
            res.body.forEach(function(project) {
              expect(project.target.title.toLowerCase().indexOf(search) >= 0).to.be.true;
            });
            done();
          });
        });
      });
    });

    it('should 200 with the list of invitable communities matching the mulitple search terms', function(done) {

      var self = this;
      var ids = this.models.communities.map(function(community) {
        return community._id;
      });

      this.helpers.elasticsearch.checkDocumentsIndexed('communities.idx', 'communities', ids, function(err) {
        if (err) {
          console.log(err);
          return done(err);
        }

        self.helpers.api.loginAsUser(self.app, self.models.users[0].emails[0], 'secret', function(err, loggedInAsUser) {
          if (err) {
            return done(err);
          }
          var req = loggedInAsUser(request(self.app).get('/api/projects/' + self.models.projects[0]._id + '/invitable?domain_id=' + self.models.domain._id + '&search=community%20searchme'));
          req.expect(200);
          req.end(function(err, res) {
            expect(err).to.not.exist;
            expect(res.body).to.exist;
            expect(res.body).to.be.an.array;
            expect(res.body.length).to.equal(2);
            done();
          });
        });
      });
    });

    it('should 200 with the list of matching communities which are not already member of the project', function(done) {

      var self = this;
      var ids = this.models.communities.map(function(community) {
        return community._id;
      });

      this.helpers.elasticsearch.checkDocumentsIndexed('communities.idx', 'communities', ids, function(err) {
        if (err) {
          console.log(err);
          return done(err);
        }

        self.helpers.api.loginAsUser(self.app, self.models.users[0].emails[0], 'secret', function(err, loggedInAsUser) {
          if (err) {
            return done(err);
          }
          var req = loggedInAsUser(request(self.app).get('/api/projects/' + self.models.projects[4]._id + '/invitable?domain_id=' + self.models.domain._id + '&search=find community'));
          req.expect(200);
          req.end(function(err, res) {
            expect(err).to.not.exist;
            expect(res.body).to.exist;
            expect(res.body).to.be.an.array;
            expect(res.body.length).to.equal(1);
            expect(res.body[0].target.title).to.equal(self.models.communities[3].title);
            done();
          });
        });
      });
    });
  });

  describe('GET /api/projects/:id/avatar', function() {
    beforeEach(function() {
      var app = require('../../backend/webserver/application')(this.helpers.modules.current.lib, this.helpers.modules.current.deps);
      this.app = this.helpers.modules.getWebServer(app);
    });

    it('should 401 when not connected', function(done) {
      request(this.app).get('/api/projects/123/avatar').expect(401).end(done);
    });

    it('should 404 when project does not exist', function(done) {
      var self = this;
      this.helpers.api.loginAsUser(this.app, this.models.users[0].emails[0], 'secret', function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var ObjectId = require('bson').ObjectId;
        var id = new ObjectId();
        var req = loggedInAsUser(request(self.app).get('/api/projects/' + id + '/avatar'));
        req.expect(404);
        req.end(done);
      });
    });
  });

  describe('POST /api/projects/:id/avatar', function() {
    beforeEach(function() {
      var app = require('../../backend/webserver/application')(this.helpers.modules.current.lib, this.helpers.modules.current.deps);
      this.app = this.helpers.modules.getWebServer(app);
    });

    it('should 401 when not connected', function(done) {
      request(this.app).post('/api/projects/123/avatar').expect(401).end(done);
    });

    it('should 404 when project does not exists', function(done) {
      var self = this;
      this.helpers.api.loginAsUser(this.app, this.models.users[0].emails[0], 'secret', function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var ObjectId = require('bson').ObjectId;
        var id = new ObjectId();
        var req = loggedInAsUser(request(self.app).post('/api/projects/' + id + '/avatar'));
        req.expect(404);
        req.end(done);
      });
    });

    it('should 403 when user is not the project creator', function(done) {
      var self = this;
      this.helpers.api.loginAsUser(this.app, this.models.users[1].emails[0], 'secret', function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(self.app).post('/api/projects/' + self.models.projects[1]._id + '/avatar'));
        req.expect(403);
        req.end(done);
      });
    });
  });
});
