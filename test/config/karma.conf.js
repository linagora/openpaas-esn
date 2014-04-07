'use strict';

module.exports = function(config) {
  config.set({
    basePath: '../../',

    files: [
      'test/frontend/karma-include/*.js',
      'frontend/components/jquery/jquery.js',
      'frontend/components/angular/angular.js',
      'frontend/components/angular-route/angular-route.js',
      'frontend/components/angular-mocks/angular-mocks.js',
      'frontend/components/underscore/underscore.js',
      'frontend/components/restangular/dist/restangular.js',
      'frontend/components/angular-spinner/angular-spinner.js',
      'frontend/components/spin.js/spin.js',
      'frontend/components/angular-recaptcha/release/angular-recaptcha.js',
      'frontend/components/chai/chai.js',
      'frontend/components/ngInfiniteScroll/ng-infinite-scroll.js',
      'frontend/js/**/*.js',
      'test/unit-frontend/**/*.js',
      'frontend/views/member/**/*.jade',
      'frontend/views/search/**/*.jade',
      'frontend/views/infinite-list/**/*.jade'
    ],

    frameworks: ['mocha'],
    colors: true,
    singleRun: true,
    autoWatch: true,
    browsers: ['PhantomJS', 'Chrome', 'Firefox'],
    reporters: ['coverage', 'spec'],
    preprocessors: {
      'frontend/js/*.js': ['coverage'],
      '**/*.jade': 'ng-jade2js'
    },

    plugins: [
      'karma-phantomjs-launcher',
      'karma-chrome-launcher',
      'karma-firefox-launcher',
      'karma-mocha',
      'karma-coverage',
      'karma-spec-reporter',
      'karma-ng-jade2js-preprocessor'
    ],

    junitReporter: {
      outputFile: 'test_out/unit.xml',
      suite: 'unit-frontend'
    },

    coverageReporter: {type: 'text', dir: '/tmp'},

    ngJade2JsPreprocessor: {
      stripPrefix: 'frontend',
      // setting this option will create only a single module that contains templates
      // from all the files, so you can load them all with module('templates')
      jadeRenderConfig: function(str){
        return str;
      },
      moduleName: 'jadeTemplates'
    }

  });
};
