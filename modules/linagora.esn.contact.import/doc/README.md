# linagora.esn.contact.import

This modules provides APIs to import contact from external accounts into OpenPaaS ESN.

## Adding an importer

Each importer must register itself into the import module.
Once registered, the importer can be called and import contacts into the user addressbooks.

The importer object to register is defined as:

```javascript

const FRONTEND_JS_PATH = __dirname + '/frontend/js/';

// the frontend angular modules
const frontendJsFileFullPaths = glob.sync([
  FRONTEND_JS_PATH + '*.js'
]);

const frontendJsFileURIs = frontendJsFileFullPaths.map(function(filepath) {
  return filepath.replace(FRONTEND_JS_PATH, '');
});

const lib = {
  importer: function(dependencies) {
    return function importContact() {
      // ...
    }
  },
  mapping: {
    toVcard: function(json) {
      //...
      return vcard;
    }
  }
};

const importer = {
  ns: 'contact.import.twitter',
  name: 'twitter',
  lib: lib,
  frontend: {
    // where to get frontend assets (less, templates, js)
    staticPath: path.normalize(__dirname + '/frontend'),
    jsFileFullPaths: frontendJsFileFullPaths,
    jsFileURIs: frontendJsFileURIs,
    // angular module name
    moduleName: 'linagora.esn.contact.import.twitter'
  }
};

// add the importer to the contact-import module
dependencies('contact-import').lib.importers.add(importer);
```