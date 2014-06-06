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
      'frontend/components/angular-animate/angular-animate.js',
      'frontend/components/angular-strap/dist/angular-strap.js',
      'frontend/components/underscore/underscore.js',
      'frontend/components/restangular/dist/restangular.js',
      'frontend/components/angular-spinner/angular-spinner.js',
      'frontend/components/spin.js/spin.js',
      'frontend/components/angular-recaptcha/release/angular-recaptcha.js',
      'frontend/components/chai/chai.js',
      'frontend/components/ngInfiniteScroll/build/ng-infinite-scroll.js',
      'frontend/components/ng-tags-input/ng-tags-input.js',
      'frontend/components/angular-xeditable/dist/js/xeditable.js',
      'frontend/js/**/*.js',
      'test/unit-frontend/**/*.js',
      'frontend/views/modules/member/**/*.jade',
      'frontend/views/modules/activitystream/**/*.jade',
      'frontend/views/modules/search/**/*.jade',
      'frontend/views/modules/infinite-list/**/*.jade',
      'frontend/views/modules/message/**/*.jade'
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
      jadeRenderConfig: {
        __: function(str) {
          return str;
        }
      },
      moduleName: 'jadeTemplates'
    }

  });
};
