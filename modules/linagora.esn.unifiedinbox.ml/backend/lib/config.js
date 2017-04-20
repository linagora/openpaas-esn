module.exports = dependencies => {
  return {
    register
  };

  /////

  function register() {
    dependencies('esn-config').registry.register('linagora.esn.unifiedinbox.ml', {
      rights: {
        admin: 'rw',
        user: 'r'
      },
      configurations: {
        'classification.enabled': {},
        'classification.minConfidence': {},
        'classification.markItemAsReadWhenMoving': {},
        'classification.showSuggestionsFolder': {}
      }
    });
  }
};
