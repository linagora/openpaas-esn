module.exports = dependencies => {
  const esnConfig = dependencies('esn-config');
  const CONFIG = {
    rights: {
      admin: 'rw',
      user: 'r'
    },
    configurations: {
      view: {},
      api: {},
      uploadUrl: {},
      downloadUrl: {},
      isJmapSendingEnabled: {},
      isSaveDraftBeforeSendingEnabled: {},
      'composer.attachments': {},
      maxSizeUpload: {},
      'twitter.tweets': {},
      drafts: {},
      swipeRightAction: {}
    }
  };

  return {
    register
  };

  function register() {
    esnConfig.registry.register('linagora.esn.unifiedinbox', CONFIG);
  }
};
