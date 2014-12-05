'use strict';
var expect = require('chai').expect;
var request = require('supertest');


describe('linagora.esn.project module', function() {
  var moduleName = 'linagora.esn.project';
  beforeEach(function(done) {
    var self = this;
    this.helpers.modules.initMidway(moduleName, function(err) {
      if (err) {
        return done(err);
      }
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
          done();
        }
      );
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
          expect(res.body.length).to.equal(4);
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

  describe('POST /api/projects/:id', function() {
    it('should send back 401 when not logged in', function(done) {
      var app = require('../../backend/webserver/application')(this.helpers.modules.current.lib, this.helpers.modules.current.deps);
      request(app).get('/api/projects').expect(401).end(function(err, res) {
        expect(err).to.be.null;
        done();
      });
    });

    it('should send back 400 when project title is missing', function(done) {
      var self = this;

      self.helpers.api.loginAsUser(this.app, this.models.users[1].emails[0], 'secret', function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(this.app).post('/api/projects'));
        req.send({title: ''});
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

    it('should send back 201 when project is created', function(done) {
      var self = this;

      self.helpers.api.loginAsUser(this.app, this.models.users[1].emails[0], 'secret', function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(this.app).post('/api/projects'));
        req.send({title: 'a new project'});
        req.expect(201).end(function(err, res) {
          expect(err).to.not.exist;
          expect(res.body).to.be.an('object');
          expect(res.body.title).to.equal('a new project');
          expect(res.body.type).to.equal('open');
          expect(res.body._id).to.exist;
          done();
        });
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

  describe('GET /api/user/activitystreams', function() {
    beforeEach(function() {
      var app = require('../../backend/webserver/application')(this.helpers.modules.current.lib, this.helpers.modules.current.deps);
      this.app = this.helpers.modules.getWebServer(app);
    });

    it('should include project resources', function(done) {
      this.helpers.api.loginAsUser(this.app, this.models.users[1].emails[0], 'secret', function(err, loggedInAsUser) {
        if (err) { return done(err); }

        var project = this.models.projects[0];
        var projectId = this.models.projects[0]._id.toString();
        var req = loggedInAsUser(request(this.app).get('/api/user/activitystreams'));
        req.expect(200).end(function(err, res) {
          expect(err).to.not.exist;
          expect(res.body).to.be.an('array');
          var foundProject, foundCommunity;
          res.body.forEach(function(entry) {
            if (entry.target.objectType === 'project' &&
                entry.target._id === projectId) {
              expect(entry.uuid).to.exist;
              expect(entry.target.displayName).to.equal(project.title);
              expect(entry.target.id).to.equal('urn:linagora.com:project:' + projectId);
              foundProject = true;
            } else if (entry.target.objectType === 'community') {
              // Find at least one to ensure they are not overwritten
              foundCommunity = true;
            }
          });
          expect(foundProject).to.be.true;
          expect(foundCommunity).to.be.true;
          done();
        });
      }.bind(this));
    });
  });
});
