'use strict';

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
    watch: {
      files: ['<%= jshint.files %>'],
      tasks: ['jshint']
    },
    mochacli: {
      options: {
        require: ['chai', 'mockery'],
        reporter: 'spec'
      },
      backend: {
        options: {
          files: ['test/unit-backend/all.js', 'test/unit-backend/**/*.js']
        }
      },
      midway: {
        options: {
          files: ['test/midway-backend/all.js', 'test/midway-backend/**/*.js']
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
    }
  });
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-mocha-cli');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-nodemon');

  grunt.registerTask('test-unit-backend', 'run the backend unit tests', ['test-backend-prepare', 'mochacli:backend']);
  grunt.registerTask('test-midway-backend', 'run midway tests', ['test-backend-prepare', 'mochacli:midway']);
  grunt.registerTask('test-backend', 'run both the unit & midway tests', ['test-unit-backend', 'test-midway-backend']);

  grunt.registerTask('test-backend-prepare', 'prepare tests environment', function() {
    var done = this.async();
    
    var child = require('child_process').spawn('sh', ['./scripts/prepare-backend-tests-environment.sh']);
    
    child.stdout.on('data', function(chunk) { grunt.log.write(chunk); });
    child.stderr.on('data', function(chunk) { grunt.log.error(chunk); });
    child.on('close',function(code) { done(code ? false : true); });
  });

  grunt.registerTask('gjslint', 'run the closure linter', function() {
    var done = this.async();
    
    var child = require('child_process').spawn('python', ['./scripts/gjslint.py', '--disable', '0110', '--nojsdoc', '-r', 'test', '-r', 'backend', '-r', 'frontend/js']);
    
    child.stdout.on('data', function(chunk) { grunt.log.write(chunk); });
    child.stderr.on('data', function(chunk) { grunt.log.error(chunk); });
    child.on('close',function(code) { done(code ? false : true); });
  });


  grunt.registerTask('test-frontend', 'run the FrontEnd tests', function() {
    var done = this.async();
    
    var child = require('child_process').spawn('karma', ['start', '--browsers', 'PhantomJS', './test/config/karma.conf.js']);
    
    child.stdout.on('data', function(chunk) { grunt.log.write(chunk); });
    child.stderr.on('data', function(chunk) { grunt.log.error(chunk); });
    child.on('close',function(code) { done(code ? false : true); });
  });
  
  grunt.registerTask('test-frontend-all', 'run the FrontEnd tests on all possible browsers', function() {
    var done = this.async();
    
    var child = require('child_process').spawn('karma', ['start', '--browsers', 'PhantomJS,Firefox,Chrome', './test/config/karma.conf.js']);
    
    child.stdout.on('data', function(chunk) { grunt.log.write(chunk); });
    child.stderr.on('data', function(chunk) { grunt.log.error(chunk); });
    child.on('close',function(code) { done(code ? false : true); });
  });
  grunt.registerTask('test', ['jshint', 'gjslint', 'test-backend', 'test-frontend']);
  grunt.registerTask('default', ['test']);
  
  grunt.registerTask('dev', ['nodemon:dev']);

};
