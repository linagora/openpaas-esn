'use strict';

module.exports = function(config) {
  config.set({
    basePath: '../../',

    files: [
      'test/frontend/karma-include/*.js',
      'frontend/components/jquery/dist/jquery.js',
      'frontend/components/angular/angular.js',
      'frontend/components/angular-route/angular-route.js',
      'frontend/components/angular-mocks/angular-mocks.js',
      'frontend/components/angular-animate/angular-animate.js',
      'frontend/components/angular-strap/dist/angular-strap.js',
      'frontend/components/angular-strap/dist/angular-strap.tpl.js',
      'frontend/components/underscore/underscore.js',
      'frontend/components/restangular/dist/restangular.js',
      'frontend/components/openpaas-logo/openpaas-logo.js',
      'frontend/components/angular-recaptcha/release/angular-recaptcha.js',
      'frontend/components/chai/chai.js',
      'frontend/components/ngInfiniteScroll/build/ng-infinite-scroll.js',
      'frontend/components/ng-tags-input/ng-tags-input.js',
      'frontend/components/angular-xeditable/dist/js/xeditable.js',
      'frontend/components/angular-pines-notify/src/pnotify.js',
      'frontend/components/moment/moment.js',
      'frontend/components/angular-moment/angular-moment.js',
      'frontend/components/angular-file-upload/dist/angular-file-upload-shim.min.js',
      'frontend/components/angular-file-upload/dist/angular-file-upload.min.js',
      'frontend/components/angular-truncate/src/truncate.js',
      'frontend/components/angular-sanitize/angular-sanitize.min.js',
      'frontend/components/angular-leaflet-directive/dist/angular-leaflet-directive.js',
      'frontend/components/ngGeolocation/ngGeolocation.min.js',
      'frontend/components/angular-ui-calendar/src/calendar.js',
      'frontend/components/angular-recursion/angular-recursion.min.js',
      'frontend/components/fullcalendar/dist/fullcalendar.min.js',
      'frontend/components/ical.js/build/ical.js',
      'frontend/components/angular-uuid4/angular-uuid4.min.js',
      'frontend/components/localforage/dist/localforage.min.js',
      'frontend/components/angular-localforage/dist/angular-localForage.js',
      'node_modules/async/lib/async.js',
      'node_modules/chai-jquery/chai-jquery.js',
      'frontend/components/angular-bootstrap-switch/dist/angular-bootstrap-switch.js',
      'frontend/components/showdown/compressed/showdown.js',
      'frontend/components/showdown/compressed/extensions/table.js',
      'frontend/components/angular-markdown-directive/markdown.js',
      'frontend/components/Chart.js/Chart.min.js',
      'frontend/components/angular-chart.js/dist/angular-chart.js',
      'frontend/components/angular-scroll/angular-scroll.js',
      'frontend/components/angular-gist/angular-gist.min.js',
      'frontend/components/blueimp-canvas-to-blob/js/canvas-to-blob.js',
      'frontend/js/**/*.js',
      'test/unit-frontend/**/*.js',
      'frontend/views/modules/member/**/*.jade',
      'frontend/views/modules/activitystream/**/*.jade',
      'frontend/views/modules/search/**/*.jade',
      'frontend/views/modules/infinite-list/**/*.jade',
      'frontend/views/modules/message/**/*.jade',
      'frontend/views/modules/community/**/*.jade',
      'frontend/views/modules/collaboration/**/*.jade',
      'frontend/views/modules/profile/**/*.jade',
      'frontend/views/modules/user-notification/**/*.jade',
      'frontend/views/modules/maps/**/*.jade',
      'frontend/views/modules/domain/**/*.jade',
      'frontend/views/modules/ui/**/*.jade',

      {pattern: 'frontend/images/*.png', watched: false, included: false, served: true}
    ],

    proxies: {
       '/images/': 'http://localhost:9876/images/'
    },

    frameworks: ['mocha'],
    colors: true,
    singleRun: true,
    autoWatch: true,
    browsers: ['PhantomJS', 'Chrome', 'Firefox'],
    reporters: ['coverage', 'spec'],
    preprocessors: {
      'frontend/js/**/*.js': ['coverage'],
      '**/*.jade': ['ng-jade2module'],
      'test/unit-frontend/fixtures/**': ['raw2js']
    },

    plugins: [
      'karma-phantomjs-launcher',
      'karma-chrome-launcher',
      'karma-firefox-launcher',
      'karma-mocha',
      'karma-coverage',
      'karma-spec-reporter',
      'karma-ng-jade2module-preprocessor',
      'karma-rawfixtures-preprocessor'
    ],

    junitReporter: {
      outputFile: 'test_out/unit.xml',
      suite: 'unit-frontend'
    },

    coverageReporter: {type: 'text', dir: '/tmp'},

    ngJade2ModulePreprocessor: {
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
