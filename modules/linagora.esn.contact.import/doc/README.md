# linagora.esn.contact.import

This modules provides APIs to import contact from external accounts into OpenPaaS ESN.

## Adding an importer

Each importer must register itself into the import module.
Once registered, the importer can be called and import contacts into the user addressbooks.

The importer object to register is defined as:

```javascript

// the frontend angular modules
var frontendModules = ['app.js', 'constants.js', 'services.js', 'directives.js'];

var lib = {
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

var importer = {
  ns: 'contact.import.twitter',
  name: 'twitter',
  lib: lib,
  frontend: {
    // where to get frontend assets (less, templates, js)
    staticPath: path.normalize(__dirname + '/frontend'),
    modules: frontendModules,
    // angular module name
    moduleName: 'linagora.esn.contact.import.twitter'
  }
};

// add the importer to the contact-import module
dependencies('contact-import').lib.importers.add(importer);
```