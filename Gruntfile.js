'use strict';

var fs = require('fs-extra');

var conf_path = 'test/config/';

var mongodb = JSON.parse(fs.readFileSync(conf_path + 'mongodb.conf.json'));
var redis = JSON.parse(fs.readFileSync(conf_path + 'redis.conf.json'));

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
        command: redis.cmd +
          (redis.port ? ' --port ' + redis.port : '') +
          (redis.pwd ? ' --requirepass ' + redis.pwd : '') +
          (redis.conf_file ? ' ' + redis.conf_file : ''),
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
        command: mongodb.cmd + ' --dbpath ' + mongodb.dbpath +
          (mongodb.port ? ' --port ' + mongodb.port : ''),
        options: {
          async: false,
          stdout: function(chunk){
            var done = grunt.task.current.async();
            var out = '' + chunk;
            var started = new RegExp('connections on port '+ mongodb.port);
            if(started.test(out)) {
              grunt.log.write('MongoDB server is started.');
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
      simple_target: {
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
          }
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
  grunt.registerTask('kill-servers', 'kill servers', ['shell:redis:kill', 'shell:mongo:kill']);

  grunt.registerTask('setup-environment', 'create temp folders and files for tests', function(){
    try {
      fs.mkdirsSync(mongodb.dbpath);
    } catch (err) {
      throw err;
    }
  });

  grunt.registerTask('clean-environment', 'remove temp folder for tests', function(){
    try {
      fs.removeSync(mongodb.dbpath);
    } catch (err) {
      throw err;
    }

    if(!grunt.config.get('esn.tests.success')){
      throw new Error('fail');
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
  grunt.registerTask('test', ['jshint', 'gjslint', 'setup-environment', 'continueOn', 'spawn-servers', 'run_grunt', 'kill-servers', 'clean-environment']);
  grunt.registerTask('default', ['test']);
};
