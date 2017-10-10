'use strict';

module.exports = function(config) {
  var singleRun = process.env.SINGLE_RUN ? process.env.SINGLE_RUN !== 'false' : true;

  config.set({
    basePath: '../../',

    files: [
      'frontend/components/mdi/css/materialdesignicons.min.css',
      'frontend/components/jquery/dist/jquery.js',
      'frontend/components/jquery-mockjax/dist/jquery.mockjax.js',
      'frontend/components/angular/angular.js',
      'frontend/components/angular-mocks/angular-mocks.js',
      'test/frontend/karma-include/*.js',
      'frontend/components/angular-ui-router/release/angular-ui-router.js',
      'frontend/components/ui-router-extras/release/ct-ui-router-extras.min.js',
      'frontend/components/angular-messages/angular-messages.min.js',
      'frontend/components/angular-route/angular-route.js',
      'frontend/components/angular-animate/angular-animate.js',
      'frontend/components/angular-strap/dist/angular-strap.js',
      'frontend/components/angular-strap/dist/angular-strap.tpl.js',
      'frontend/components/lodash/dist/lodash.min.js',
      'frontend/components/lng-clockpicker/dist/bootstrap-clockpicker.js',
      'frontend/components/angular-clockpicker/dist/angular-clockpicker.min.js',
      'frontend/components/restangular/dist/restangular.js',
      'frontend/components/openpaas-logo/openpaas-logo.js',
      'frontend/components/angular-recaptcha/release/angular-recaptcha.js',
      'frontend/components/chai/chai.js',
      'frontend/components/chai-datetime/chai-datetime.js',
      'frontend/components/sinon-chai/lib/sinon-chai.js',
      'node_modules/sinon/pkg/sinon.js',
      'node_modules/chai-shallow-deep-equal/chai-shallow-deep-equal.js',
      'frontend/components/ngInfiniteScroll/build/ng-infinite-scroll.js',
      'frontend/components/ng-tags-input/ng-tags-input.js',
      'frontend/components/angular-xeditable/dist/js/xeditable.js',
      'frontend/components/moment/moment.js',
      'frontend/components/moment-timezone/builds/moment-timezone-with-data-2010-2020.min.js',
      'frontend/components/angular-moment/angular-moment.js',
      'frontend/components/jstzdetect/jstz.min.js',
      'frontend/components/angular-jstz/angular-jstz.js',
      'frontend/components/angular-file-upload/dist/angular-file-upload-shim.min.js',
      'frontend/components/angular-file-upload/dist/angular-file-upload.min.js',
      'frontend/components/angular-truncate/src/truncate.js',
      'frontend/components/angular-sanitize/angular-sanitize.min.js',
      'frontend/components/angular-touch/angular-touch.min.js',
      'frontend/components/angular-leaflet-directive/dist/angular-leaflet-directive.js',
      'frontend/components/ngGeolocation/ngGeolocation.min.js',
      'frontend/components/angular-recursion/angular-recursion.min.js',
      'frontend/components/fullcalendar/dist/fullcalendar.min.js',
      'frontend/components/ical.js/build/ical.js',
      'frontend/components/angular-uuid4/angular-uuid4.min.js',
      'frontend/components/localforage/dist/localforage.min.js',
      'frontend/components/angular-localforage/dist/angular-localForage.js',
      'node_modules/async/dist/async.js',
      'node_modules/chai-jquery/chai-jquery.js',
      'frontend/components/angular-bootstrap-switch/dist/angular-bootstrap-switch.js',
      'frontend/components/showdown/dist/showdown.min.js',
      'frontend/components/angular-markdown-directive/markdown.js',
      'frontend/components/angular-scroll/angular-scroll.js',
      'frontend/components/blueimp-canvas-to-blob/js/canvas-to-blob.js',
      'frontend/components/re-tree/re-tree.js',
      'frontend/components/ng-device-detector/ng-device-detector.js',
      'frontend/components/remarkable-bootstrap-notify/bootstrap-notify.min.js',
      'frontend/components/char-api/lib/charAPI.js',
      'frontend/components/jmap-client/dist/jmap-client.js',
      'frontend/components/dynamic-directive/dist/dynamic-directive.min.js',
      'frontend/components/angularjs-naturalsort/dist/naturalSortVersion.min.js',
      'frontend/components/bootstrap/dist/js/bootstrap.min.js',
      'frontend/components/summernote/dist/summernote.js',
      'frontend/components/angular-summernote/dist/angular-summernote.min.js',
      'frontend/components/autosize/dist/autosize.min.js',
      'frontend/components/offline/offline.min.js',
      'frontend/components/matchmedia-ng/matchmedia-ng.js',
      'frontend/components/jquery.focus/dist/jquery.focus.js',
      'frontend/components/angular-feature-flags/dist/featureFlags.js',
      'frontend/components/angular-auto-focus/angular-auto-focus.js',
      'frontend/components/awesome-angular-swipe/lib/awesome-angular-swipe.js',
      'frontend/components/Autolinker.js/dist/Autolinker.js',
      'frontend/components/angular-component/dist/angular-component.min.js',
      'frontend/components/waves/dist/waves.min.js',
      'frontend/components/angular-material/modules/js/core/core.min.js',
      'frontend/components/angular-material/modules/js/showHide/showHide.min.js',
      'frontend/components/angular-material/modules/js/virtualRepeat/virtualRepeat.min.js',
      'frontend/components/angular-material/modules/js/backdrop/backdrop.min.js',
      'frontend/components/angular-material/modules/js/button/button.min.js',
      'frontend/components/angular-material/modules/js/dialog/dialog.min.js',
      'frontend/components/angular-material/modules/js/fabActions/fabActions.min.js',
      'frontend/components/angular-material/modules/js/fabSpeedDial/fabSpeedDial.min.js',
      'frontend/components/angular-material/modules/js/fabTrigger/fabTrigger.min.js',
      'frontend/components/angular-material/modules/js/tooltip/tooltip.min.js',
      'frontend/components/angular-material/modules/js/menu/menu.min.js',
      'frontend/components/angular-material/modules/js/icon/icon.min.js',
      'frontend/components/angular-material/modules/js/whiteframe/whiteframe.min.js',
      'frontend/components/angular-material/modules/js/panel/panel.min.js',
      'frontend/components/angular-material/modules/js/core/core.min.css',
      'frontend/components/angular-material/modules/js/virtualRepeat/virtualRepeat.min.css',
      'frontend/components/angular-material/modules/js/backdrop/backdrop.min.css',
      'frontend/components/angular-material/modules/js/button/button.min.css',
      'frontend/components/angular-material/modules/js/dialog/dialog.min.css',
      'frontend/components/angular-material/modules/js/fabSpeedDial/fabSpeedDial.min.css',
      'frontend/components/angular-material/modules/js/tooltip/tooltip.min.css',
      'frontend/components/angular-material/modules/js/menu/menu.min.css',
      'frontend/components/angular-material/modules/js/icon/icon.min.css',
      'frontend/components/angular-material/modules/js/whiteframe/whiteframe.min.css',
      'frontend/components/angular-material/modules/js/panel/panel.min.css',
      'frontend/components/angular-hotkeys/build/hotkeys.min.js',
      'frontend/components/videogular/videogular.min.js',
      'frontend/components/videogular-buffering/vg-buffering.min.js',
      'frontend/components/videogular-controls/vg-controls.min.js',
      'frontend/components/videogular-overlay-play/vg-overlay-play.min.js',
      'frontend/components/angular-file-saver/dist/angular-file-saver.bundle.js',
      'test/fixtures/code-generation/constants.js',

      { pattern: 'frontend/js/modules/collaboration/collaboration.run.js', watched: false, included: false, served: false },
      { pattern: 'frontend/js/modules/oauth-application/oauth-application.router.js', watched: false, included: false, served: false },
      { pattern: 'frontend/js/modules/datetime/datetime.run.js', watched: false, included: false, served: false },
      { pattern: 'frontend/js/modules/i18n/i18n.config.js', watched: false, included: false, served: true },
      { pattern: 'frontend/js/modules/shortcuts/shortcuts.run.js', watched: false, included: false, served: true },
      { pattern: 'modules/**/frontend/app/**/*.run.js', watched: false, included: false, served: true },

      'frontend/js/modules/**/*.module.js',
      'frontend/js/**/*.js',
      'modules/**/frontend/js/**/*.js',
      'modules/**/frontend/app/**/*.js',
      'modules/**/test/unit-frontend/**/*.js',

      'frontend/js/modules/**/*.pug',
      'modules/**/frontend/views/**/*.pug',
      'modules/**/frontend/app/**/*.pug',
      'frontend/views/modules/**/*.pug',

      // fixtures
      { pattern: 'frontend/images/**/*.png', watched: false, included: false, served: true },
      'modules/**/unit-frontend/fixtures/**',
      'modules/**/app/fixtures/**'
    ],

    proxies: {
      '/images/': 'frontend/images/',
      '/contact/images/': 'modules/linagora.esn.contact/frontend/images/'
    },

    logLevel: config.LOG_ERROR,
    frameworks: ['mocha'],
    colors: true,
    singleRun: singleRun,
    autoWatch: true,
    browsers: ['PhantomJS', 'Chrome', 'Firefox'],

    customLaunchers: {
      Chrome_with_debugging: {
        base: 'Chrome',
        flags: ['--remote-debugging-port=9222'],
        debug: true
      }
    },

    reporters: singleRun ? ['coverage', 'spec'] : ['spec'],

    preprocessors: {
      'modules/**/frontend/js/**/*.js': ['coverage'],
      '**/*.pug': ['ng-jade2module'],
      'modules/**/unit-frontend/fixtures/**': ['raw2js'],
      'modules/**/app/fixtures/**': ['raw2js']
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

    coverageReporter: { type: 'text', dir: '/tmp' },

    ngJade2ModulePreprocessor: {
      cacheIdFromPath: function(filepath) {
        var cacheId = '';

        if (filepath.match(/^frontend\/js*/)) {
          cacheId = '/views' + filepath.substr(11).replace('.pug', '.html');
        } else if (filepath.match(/^frontend*/)) {
          cacheId = filepath.substr(8).replace('.pug', '.html');
        } else if (filepath.match(/^modules*/)) {
          cacheId = filepath.replace('modules/linagora.esn.', '/')
            .replace('frontend/', '')
            .replace('.pug', '.html');
        }

        return cacheId;
      },
      jadeRenderLocals: {
        __: function(str) {
          return str;
        }
      },
      jadeRenderOptions: {
        basedir: require('path').resolve(__dirname, '../../frontend/views')
      },
      moduleName: 'jadeTemplates'
    }

  });
};
