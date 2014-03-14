'use strict';

var fs = require('fs-extra');

var conf_path = './test/config/';
var servers = require( conf_path + 'servers-conf');

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
        ignores: []
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
      }
    },
    nodemon: {
      dev: {
        script: 'server.js',
        options: {
          env: {NODE_ENV: 'dev'},
          ignore: ['.git', 'README.md', 'node_modules/**'],
          watchedExtensions: ['js', 'jade']
        }
      }
    },
    run_grunt: {
      all: {
        options: {
          log: true,
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
      unit_backend: {
        options: {
          log: true,
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
          task: ['test-unit-backend']
        },
        src: ['Gruntfile-tests.js']
      },
      frontend: {
        options: {
          log: true,
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

  grunt.registerTask('spawn-servers', 'spawn servers', ['shell']);
  grunt.registerTask('kill-servers', 'kill servers', ['shell:redis:kill', 'shell:mongo:kill', 'shell:ldap:kill']);

  grunt.registerTask('setup-environment', 'create temp folders and files for tests', function(){
    try {
      fs.mkdirsSync(servers.mongodb.dbpath);
    } catch (err) {
      throw err;
    }
  });

  grunt.registerTask('clean-environment', 'remove temp folder for tests', function(){
    try {
      fs.removeSync(servers.mongodb.dbpath);
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

    var child = require('child_process').spawn('python', ['./scripts/gjslint.py', '--disable', '0110', '--nojsdoc', '-r', 'test', '-r', 'backend', '-r', 'frontend/js']);

    child.stdout.on('data', function(chunk) { grunt.log.write(chunk); });
    child.stderr.on('data', function(chunk) { grunt.log.error(chunk); });
    child.on('close',function(code) { done(code ? false : true); });
  });

  grunt.registerTask('dev', ['nodemon:dev']);
  grunt.registerTask('test-midway-backend', ['setup-environment', 'spawn-servers', 'continueOn', 'run_grunt:midway_backend', 'kill-servers', 'clean-environment']);
  grunt.registerTask('test-unit-backend', ['setup-environment', 'spawn-servers', 'continueOn', 'run_grunt:unit_backend', 'kill-servers', 'clean-environment']);
  grunt.registerTask('test-frontend', ['run_grunt:frontend']);
  grunt.registerTask('test', ['jshint', 'gjslint', 'setup-environment', 'spawn-servers', 'continueOn', 'run_grunt:all', 'kill-servers', 'clean-environment']);
  grunt.registerTask('default', ['test']);
  grunt.registerTask('fixtures', 'Launch the fixtures injection', function() {
    var done = this.async();
    require('./fixtures')(function(err) {
      done(err ? false : true);
    });
  });
};
