'use strict';

const AwesomeModule = require('awesome-module');
const Dependency = AwesomeModule.AwesomeModuleDependency;
const path = require('path');
const glob = require('glob-all');

const FRONTEND_PATH = path.resolve(__dirname, 'frontend');
const FRONTEND_VIEW_PATH = `${__dirname}/frontend/views/`;
const MODULE_NAME = 'profile';
const AWESOME_MODULE_NAME = `linagora.esn.${MODULE_NAME}`;
const jsFiles = [
  'app.js',
  'controllers.js',
  'services.js',
  'directives.js'
];
const frontendFullPathModules = jsFiles.map(file => path.resolve(FRONTEND_PATH, 'js', file));
const lessFile = path.resolve(FRONTEND_PATH, 'css/styles.less');
const frontendViewFullPathModules = glob.sync([
  FRONTEND_VIEW_PATH + '**/*.jade'
]);
const viewsFiles = frontendViewFullPathModules.map(filepath => filepath.replace(FRONTEND_VIEW_PATH, ''));

const profileModule = new AwesomeModule('linagora.esn.profile', {
  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.wrapper', 'webserver-wrapper'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.i18n', 'i18n')
  ],

  states: {
    lib(dependencies, callback) {
      const profilelib = require('./backend/lib')(dependencies);
      const lib = {
        lib: profilelib
      };

      return callback(null, lib);
    },

    deploy(dependencies, callback) {
      const app = require('./backend/webserver')(dependencies, this);
      const webserverWrapper = dependencies('webserver-wrapper');

      webserverWrapper.injectAngularModules(MODULE_NAME, jsFiles, [AWESOME_MODULE_NAME], ['esn'], {
        localJsFiles: frontendFullPathModules
      });

      webserverWrapper.injectLess(MODULE_NAME, [lessFile], 'esn');
      webserverWrapper.addApp(MODULE_NAME, app);

      return callback();
    },

    start(dependencies, callback) {
      callback();
    }
  }
});

profileModule.frontendInjections = {
  angularModules: [
    [
      MODULE_NAME, jsFiles,
      [AWESOME_MODULE_NAME],
      ['esn'],
      { localJsFiles: frontendFullPathModules }
    ]
  ],
  less: [
    [
      MODULE_NAME, [lessFile], 'esn'
    ]
  ],
  js: [
    {
      moduleName: MODULE_NAME,
      path: {
        base: 'frontend/js',
        serve: `${MODULE_NAME}/js`
      },
      moduleJS: jsFiles
    }
  ],
  views: [
    {
      moduleName: MODULE_NAME,
      path: {
        base: 'frontend/views',
        serve: `${MODULE_NAME}/views`
      },
      moduleViews: viewsFiles
    }
  ],
  i18n: [
    'backend/lib/i18n/locales/fr.json',
    'backend/lib/i18n/locales/en.json',
    'backend/lib/i18n/locales/vi.json'
  ]
};

module.exports = profileModule;
