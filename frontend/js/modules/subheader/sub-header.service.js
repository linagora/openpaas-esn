(function(angular) {
  'use strict';

  angular.module('esn.subheader')

    .factory('subHeaderService', function($rootScope, SUBHEADER_VISIBLE_EVENT) {
      var subHeaderQueue = [];
      var injectSubHeader;
      var destroySubHeader;
      var visible = false;

      function registerContainer(injectHandler, destroyHandler) {
        injectSubHeader = injectHandler;
        destroySubHeader = destroyHandler;

        if (subHeaderQueue.length > 0) {
          subHeaderQueue.forEach(function(item) {
            injectHandler(item.content);
          });
          subHeaderQueue = [];
        }
      }

      function unregisterContainer() {
        subHeaderQueue = [];
        injectSubHeader = destroySubHeader = null;
        setVisible(false);
      }

      function inject(content) {
        if (injectSubHeader) {
          injectSubHeader(content);
        } else {
          subHeaderQueue.push({
            content: content
          });
        }
      }

      function destroy() {
        if (destroySubHeader) {
          destroySubHeader();
        }
      }

      function setVisible(_visible) {
        if (_visible !== visible) {
          visible = _visible;
          $rootScope.$broadcast(SUBHEADER_VISIBLE_EVENT, visible);
        }
      }

      function isVisible() {
        return visible;
      }

      return {
        registerContainer: registerContainer,
        unregisterContainer: unregisterContainer,
        inject: inject,
        destroy: destroy,
        setVisible: setVisible,
        isVisible: isVisible
      };
    });
})(angular);
