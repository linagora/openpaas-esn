'use strict';

var fs = require('fs-extra');

var conf_path = './test/config/';
var servers = require( conf_path + 'servers-conf');
var config = require('./config/default.json');

module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      options: {
        separator: ';'
      }
    },
    jshint: {
      files: ['Gruntfile.js', 'backend/**/*.js', 'frontend/js/**/*.js', 'test/**/**/*.js'],
      options: {
        jshintrc: '.jshintrc',
        ignores: ['test/frontend/karma-include/*', 'frontend/js/modules/modernizr.js']
      }
    },
    shell: {
      redis: {
        command: servers.redis.cmd + ' --port ' +
          (servers.redis.port ? servers.redis.port : '23457') +
          (servers.redis.pwd ? ' --requirepass ' + servers.redis.pwd : '') +
          (servers.redis.conf_file ? ' ' + servers.redis.conf_file : ''),
        options: {
          async: false,
          stdout: function(chunk){
            var done = grunt.task.current.async();
            var out = '' + chunk;
            var started=/on port/;
            if(started.test(out)) {
              grunt.log.write('Redis server is started.');
              done(true);
            }
          },
          stderr: function(chunk) {
            grunt.log.error(chunk);
          }
        }
      },
      mongo: {
        command: servers.mongodb.cmd + ' --dbpath ' + servers.mongodb.dbpath + ' --port ' +
          (servers.mongodb.port ? servers.mongodb.port : '23456') + ' --nojournal',
        options: {
          async: false,
          stdout: function(chunk){
            var done = grunt.task.current.async();
            var out = '' + chunk;
            var started = new RegExp('connections on port '+ servers.mongodb.port);
            if(started.test(out)) {
              grunt.log.write('MongoDB server is started.');
              done(true);
            }
          },
          stderr: function(chunk) {
            grunt.log.error(chunk);
          }
        }
      },
      mongo_replSet: {
        command: servers.mongodb.cmd + ' --dbpath ' + servers.mongodb.dbpath + ' --port ' +
          (servers.mongodb.port ? servers.mongodb.port : '23456') + ' --replSet \'' +
          servers.mongodb.replicat_set_name + '\' --smallfiles --oplogSize 128',
        options: {
          async: false,
          stdout: function(chunk){
            var done = grunt.task.current.async();
            var out = '' + chunk;
            var started = new RegExp('connections on port '+ servers.mongodb.port);
            if(started.test(out)) {
              grunt.log.write('MongoDB server is started.');
              done(true);
            }
          },
          stderr: function(chunk) {
            grunt.log.error(chunk);
          }
        }
      },
      ldap: {
        command: servers.ldap.cmd,
        options: {
          async: false,
          stdout: function(chunk){
            var done = grunt.task.current.async();
            var out = '' + chunk;
            var started=/LDAP server up at/;
            if(started.test(out)) {
              grunt.log.write('Ldap server is started.');
              done(true);
            }
          },
          stderr: function(chunk) {
            grunt.log.error(chunk);
          }
        }
      },
      elasticsearch: {
        command: servers.elasticsearch.cmd +
          ' -Des.http.port=' + servers.elasticsearch.port +
          ' -Des.transport.tcp.port=' + servers.elasticsearch.communication_port +
          ' -Des.cluster.name=' + servers.elasticsearch.cluster_name +
          ' -Des.path.data=' + servers.elasticsearch.data_path +
          ' -Des.path.work=' + servers.elasticsearch.work_path +
          ' -Des.path.logs=' + servers.elasticsearch.logs_path +
          ' -Des.discovery.zen.ping.multicast.enabled=false',
        options: {
          async: false,
          stdout: function(chunk){
            var done = grunt.task.current.async();
            var out = '' + chunk;
            var started=/started/;
            if(started.test(out)) {
              grunt.log.write('Elasticsearch server is started.');
              done(true);
            }
          },
          stderr: function(chunk) {
            grunt.log.error(chunk);
          }
        }
      }
    },
    nodemon: {
      dev: {
        script: 'server.js',
        options: {
          env: {NODE_ENV: 'dev'},
          ignore: ['frontend/**', '.git', 'README.md', 'node_modules/**', 'test/**', 'doc/**', 'fixtures/**', 'log/**'],
          watchedExtensions: ['js'],
          callback: function (nodemon) {
            nodemon.on('log', function (event) {
              console.log(event.colour);
            });

            nodemon.on('config:update', function () {
              // Delay before server listens on port
              setTimeout(function() {
                require('open')('http://localhost:' + config.webserver.port || 8080);
              }, 2000);
            });
          }
        }
      }
    },
    run_grunt: {
      all: {
        options: {
          log: true,
          stdout: function(data) {
            grunt.log.write(data);
          },
          stderr: function(data) {
            grunt.log.error(data);
          },
          args: grunt.option('test') ? {test: grunt.option('test')} : {},
          process: function(res){
            if (res.fail){
              grunt.config.set('esn.tests.success',false);
              grunt.log.writeln('failed');
            } else {
              grunt.config.set('esn.tests.success',true);
              grunt.log.writeln('succeeded');
            }
          }
        },
        src: ['Gruntfile-tests.js']
      },
      midway_backend: {
        options: {
          log: true,
          stdout: function(data) {
            grunt.log.write(data);
          },
          stderr: function(data) {
            grunt.log.error(data);
          },
          args: grunt.option('test') ? {test: grunt.option('test')} : {},
          process: function(res){
            if (res.fail){
              grunt.config.set('esn.tests.success',false);
              grunt.log.writeln('failed');
            } else {
              grunt.config.set('esn.tests.success',true);
              grunt.log.writeln('succeeded');
            }
          },
          task: ['test-midway-backend']
        },
        src: ['Gruntfile-tests.js']
      },
      midway_backend_split: {
        options: {
          log: true,
          stdout: function(data) {
            grunt.log.write(data);
          },
          stderr: function(data) {
            grunt.log.error(data);
          },
          args: grunt.option('test') ? {test: grunt.option('test')} : {},
          process: function(res){
            if (res.fail){
              grunt.config.set('esn.tests.success',false);
              grunt.log.writeln('failed');
            } else {
              grunt.config.set('esn.tests.success',true);
              grunt.log.writeln('succeeded');
            }
          },
          task: ['test-midway-backend-split']
        },
        src: ['Gruntfile-tests.js']
      },
      unit_backend: {
        options: {
          log: true,
          args: grunt.option('test') ? {test: grunt.option('test')} : {},
          stdout: function(data) {
            grunt.log.write(data);
          },
          stderr: function(data) {
            grunt.log.error(data);
          },
          process: function(res){
            if (res.fail){
              grunt.config.set('esn.tests.success',false);
              grunt.log.writeln('failed');
            } else {
              grunt.config.set('esn.tests.success',true);
              grunt.log.writeln('succeeded');
            }
          },
          task: ['test-unit-backend']
        },
        src: ['Gruntfile-tests.js']
      },
      frontend: {
        options: {
          log: true,
          stdout: function(data) {
            grunt.log.write(data);
          },
          stderr: function(data) {
            grunt.log.error(data);
          },
          process: function(res){
            if (res.fail){
              grunt.config.set('esn.tests.success',false);
              grunt.log.writeln('failed');
            } else {
              grunt.config.set('esn.tests.success',true);
              grunt.log.writeln('succeeded');
            }
          },
          task: ['test-frontend']
        },
        src: ['Gruntfile-tests.js']
      },
      unit_storage: {
        options: {
          log: true,
          stdout: function(data) {
            grunt.log.write(data);
          },
          stderr: function(data) {
            grunt.log.error(data);
          },
          process: function(res){
            if (res.fail){
              grunt.config.set('esn.tests.success',false);
              grunt.log.writeln('failed');
            } else {
              grunt.config.set('esn.tests.success',true);
              grunt.log.writeln('succeeded');
            }
          },
          task: ['test-unit-storage']
        },
        src: ['Gruntfile-tests.js']
      }
    },
    watch: {
      files: ['<%= jshint.files %>'],
      tasks: ['jshint']
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-nodemon');
  grunt.loadNpmTasks('grunt-shell-spawn');
  grunt.loadNpmTasks('grunt-continue');
  grunt.loadNpmTasks('grunt-run-grunt');

  grunt.registerTask('spawn-servers', 'spawn servers', ['shell:redis', 'shell:mongo_replSet', 'shell:elasticsearch']);
  grunt.registerTask('kill-servers', 'kill servers', ['shell:redis:kill', 'shell:mongo_replSet:kill', 'shell:elasticsearch:kill']);

  grunt.registerTask('setup-environment', 'create temp folders and files for tests', function(){
    try {
      fs.mkdirsSync(servers.mongodb.dbpath);
      fs.mkdirsSync(servers.tmp);
    } catch (err) {
      throw err;
    }
  });

  grunt.registerTask('clean-environment', 'remove temp folder for tests', function(){

    function removeAllFilesInDirectory(directory) {
      var files;
      try {
        files = fs.readdirSync(directory);
      } catch (e) { return; }
      if (files.length > 0) {
        for (var i = 0; i < files.length; i++) {
          var filePath = directory + '/' + files[i];
          if (fs.statSync(filePath).isFile()) {
            fs.unlinkSync(filePath);
          } else {
            removeAllFilesInDirectory(filePath);
          }
        }
      }
      try {
        fs.rmdirSync(directory);
      } catch (e) {}
    }

    try {
      removeAllFilesInDirectory(servers.tmp);
    } catch (err) {
      throw err;
    }

    if(!grunt.config.get('esn.tests.success')){
      grunt.log.writeln('Tests failure');
      grunt.fail.fatal('error', 3);
    }
  });

  grunt.registerTask('gjslint', 'run the closure linter', function() {
    var done = this.async();

    var child = require('child_process').spawn('python', [
      './scripts/gjslint.py',
      '--disable',
      '0110',
      '--nojsdoc',
      '-r',
      'test',
      '-r',
      'backend',
      '-r',
      'frontend/js',
      '-e',
      'test/frontend/karma-include',
      '-x',
      'frontend/js/modules/modernizr.js'
    ]);

    child.stdout.on('data', function(chunk) { grunt.log.write(chunk); });
    child.stderr.on('data', function(chunk) { grunt.log.error(chunk); });
    child.on('close',function(code) { done(code ? false : true); });
  });

  grunt.registerTask('mongoReplicationMode', 'setup mongo replica set', function() {
    var done = this.async();
    var async = require('async');

    var MongoClient = require('mongodb').MongoClient;
    var Server = require('mongodb').Server;

    var client = new MongoClient(new Server('localhost', servers.mongodb.port), {native_parser: true});

    client.open(function(err, mongoClient) {
      if (err) {
        grunt.log.error('MongoDB - Error when open a mongodb connection : ' + err);
        done(false);
      }
      var db = client.db('admin');
      db.command({
        replSetInitiate: {
          _id: servers.mongodb.replicat_set_name,
          members: [
            {_id: 0, host: '127.0.0.1:' + servers.mongodb.port}
          ]
        }
      }, function(err, response) {
        if (err) {
          grunt.log.error('MongoDB - Error when executing rs.initiate() : ' + err);
          done(false);
        }
        if (response && response.ok === 1) {
          grunt.log.writeln('MongoDB - rs.initiate() done');

          var nbExecuted = 0;
          var finish = false;
          async.doWhilst(function(callback) {
            setTimeout(function() {

              db.command({isMaster: 1}, function(err, response) {
                if (err) {
                  grunt.log.error('MongoDB - Error when executing db.isMaster() : ' + err);
                  done(false);
                }
                if (response.ismaster) {
                  finish = true;
                  return callback();
                }
                nbExecuted++;
                if (nbExecuted >= servers.mongodb.tries_replica_set) {
                  return callback(new Error(
                      'Number of tries of check if the replica set is launch and have a master reached the maximum allowed. ' +
                      'Increase the number of tries or check if the mongodb "rs.initiate()" works'));
                }
                return callback();
              });
            }, servers.mongodb.interval_replica_set);

          }, function() {
            return (!finish) && nbExecuted < servers.mongodb.tries_replica_set;
          }, function(err) {
            if (err) {
              return done(false);
            }
            grunt.log.write('MongoDB - replica set launched and master is ready');
            done(true);
          });

        }
        else {
          grunt.log.writeln('MongoDB - rs.initiate() done but there are problems : ' + response);
          done(false);
        }
      });
    });
  });

  grunt.registerTask('mongoElasticsearchRivers', 'setup elasticsearch mongodb river', function() {
    var done = this.async();

    var request = require('superagent');
    var elasticsearchURL = 'localhost:' + servers.elasticsearch.port;

    var async = require('async');
    var functionsArray = [];

    var wrapper = function (collection) {
      var functionToAdd = function (callback) {
        request
          .put(elasticsearchURL + '/_river/' + collection + '/_meta')
          .set('Content-Type', 'application/json')
          .send({
            'type': 'mongodb',
            'mongodb': {
              'servers': [ { host: 'localhost', port : servers.mongodb.port  } ],
              'db': servers.mongodb.dbname,
              'collection': collection
            },
            'index': {
              'name': collection + '.idx',
              'type': collection
            }
          })
          .end(function(res){
            if (res.status === 201) {
              callback(null, res.body);
            }
            else {
              callback(new Error('Error HTTP status : ' + res.status + ', expected status code 201 Created !'), null);
            }
          });
      };
      functionsArray.push(functionToAdd);
    };

    for (var i = 0 ; i < servers.mongodb.elasticsearch.rivers.length ; i++) {
      var collection = servers.mongodb.elasticsearch.rivers[i];
      wrapper(collection);
    }

    async.parallel(functionsArray, function (err, results) {
      if (err) {
        done(err);
      }
      grunt.log.write('Elasticsearch rivers are successfully setup');
      done(true);
    });

  });

  grunt.registerTask('elasticsearchIndexUsersSettings', 'setup elasticsearch mongodb river', function() {
    var done = this.async();

    var request = require('superagent');
    var elasticsearchURL = 'localhost:' + servers.elasticsearch.port;

    request
      .put(elasticsearchURL + '/' + 'users.idx')
      .set('Content-Type', 'application/json')
      .send({
        settings: {
          analysis: {
            filter: {
              nGram_filter: {
                type: 'nGram',
                min_gram: 2,
                max_gram: 20,
                token_chars: [
                  'letter',
                  'digit',
                  'punctuation',
                  'symbol'
                ]
              }
            },
            analyzer: {
              nGram_analyzer: {
                type: 'custom',
                tokenizer: 'whitespace',
                filter: [
                  'lowercase',
                  'asciifolding',
                  'nGram_filter'
                ]
              },
              whitespace_analyzer: {
                type: 'custom',
                tokenizer: 'whitespace',
                filter: [
                  'lowercase',
                  'asciifolding'
                ]
              }
            }
          }
        },
        mappings: {
          users: {
            properties: {
              firstname: {
                type: 'string',
                index_analyzer: 'nGram_analyzer',
                search_analyzer: 'whitespace_analyzer',
                fields: {
                  sort: {
                    type: 'string',
                    index: 'not_analyzed'
                  }
                }
              },
              lastname: {
                type: 'string',
                index_analyzer: 'nGram_analyzer',
                search_analyzer: 'whitespace_analyzer'
              },
              emails: {
                type: 'string',
                index_analyzer: 'nGram_analyzer',
                search_analyzer: 'whitespace_analyzer'
              }
            }
          }
        }
      })
      .end(function(res){
        if (res.status === 200) {
          grunt.log.write('Elasticsearch settings are successfully added');
          done(true);
        }
        else {
          done(new Error('Error HTTP status : ' + res.status + ', expected status code 201 Created !'));
        }
      });
  });

  grunt.registerTask('dev', ['nodemon:dev']);
  grunt.registerTask('setup-mongo-es', ['spawn-servers', 'continueOn', 'mongoReplicationMode', 'elasticsearchIndexUsersSettings', 'mongoElasticsearchRivers']);
  grunt.registerTask('test-midway-backend', ['setup-environment', 'setup-mongo-es', 'run_grunt:midway_backend', 'kill-servers', 'clean-environment']);
  grunt.registerTask('test-mbsplit', ['setup-environment', 'setup-mongo-es', 'run_grunt:midway_backend_split', 'kill-servers', 'clean-environment']);
  grunt.registerTask('test-unit-backend', ['setup-environment', 'run_grunt:unit_backend', 'clean-environment']);
  grunt.registerTask('test-unit-storage', ['setup-environment', 'setup-mongo-es', 'run_grunt:unit_storage', 'kill-servers', 'clean-environment']);
  grunt.registerTask('test-frontend', ['run_grunt:frontend']);
  grunt.registerTask('test', ['linters', 'setup-environment', 'run_grunt:frontend', 'run_grunt:unit_backend', 'setup-mongo-es', 'run_grunt:unit_storage', 'run_grunt:midway_backend_split', 'kill-servers', 'clean-environment']);
  grunt.registerTask('linters', ['jshint', 'gjslint']);
  grunt.registerTask('default', ['test']);
  grunt.registerTask('fixtures', 'Launch the fixtures injection', function() {
    var done = this.async();
    require('./fixtures')(function(err) {
      done(err ? false : true);
    });
  });
};
