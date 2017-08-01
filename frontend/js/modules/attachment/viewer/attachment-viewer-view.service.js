(function() {
  'use strict';

  angular.module('esn.attachment')
    .factory('esnAttachmentViewerViewService', esnAttachmentViewerViewService);

  function esnAttachmentViewerViewService(FileSaver, $compile, $window, $rootScope, $http) {
    //var self = this;

    var $el = angular.element;
    var $body = $el('body');

    var defaultOptions = {
      initSize: {
        width: 250,
        height: 250
      },
      screenWidth: {
        more0: 0,
        more6: 600,
        more8: 800
      },
      minRatio: {
        more0: 0.8,
        more6: 0.5,
        more8: 0.3
      }
    };

    var elements = {};
    var currentItem = {};

    return {
      renderModal: renderModal,
      openViewer: openViewer,
      calculateSize: calculateSize,
      resizeElements: resizeElements,
      onHide: onHide
    };

    function renderModal() {
      if (!elements.attachmentViewer) {
        var template = '<div class="attachment-viewer" id="attachmentViewer"><div class="av-topBar"><div class="av-data"><div class="av-details"><span class="av-number"></span><span class="av-caption ellipsis"></span></div><div class="av-download"><a id="downloadFile" href=""><i class="mdi mdi-download mdi-hc-fw"></i></a></div><div class="av-closeContainer"> <span class="av-close"><i class="mdi mdi-close mdi-hc-fw"></i></span></div></div></div><div class="av-outerContainer"><div class="av-container"><div class="av-main"></div><div class="av-loader"> <span class="av-cancel"></span></div><div class="av-nav"> <span class="av-prev nav"> <i class="mdi mdi-chevron-left mdi-hc-fw"> </i> </span> <span class="av-next nav"> <i class="mdi mdi-chevron-right mdi-hc-fw"> </i></span></div></div></div></div>';
        $body.append(template);
        buildModal();
      }
    }

    function buildModal() {
      var attachmentViewer = $el('#attachmentViewer');
      elements = {
        attachmentViewer: attachmentViewer,
        topBar: attachmentViewer.find('.av-topBar'),
        outerContainer: attachmentViewer.find('.av-outerContainer'),
        container: attachmentViewer.find('.av-container'),
        mainContent: attachmentViewer.find('.av-main'),
        nav: attachmentViewer.find('.av-nav'),
        loader: attachmentViewer.find('.av-loader')
      };
      elements.attachmentViewer.on('click', function(e) {
        if ($el(e.target).attr('id') === 'attachmentViewer') {
          hide(elements.attachmentViewer);
        }
        return false;
      });
      elements.attachmentViewer.find('.av-closeContainer').on('click', function() {
        hide(elements.attachmentViewer);
        return false;
      });
      elements.nav.find('.av-prev').on('click', function() {
        var files = currentItem.files;
        var order;
        if (currentItem.order === 0) {
          order = files.length - 1;
        } else {
          order = currentItem.order - 1;
        }
        openViewer(files, order);
        return false;
      });
      elements.nav.find('.av-next').on('click', function() {
        var files = currentItem.files;
        var order;
        if (currentItem.order === files.length - 1) {
          order = 0;
        } else {
          order = currentItem.order + 1;
        }
        openViewer(files, order);
        return false;
      });

      elements.topBar.find('#downloadFile').on('click', function() {
        downloadFile(currentItem.files[currentItem.order]);
      });
    }

    function setCurrentItem(files, order) {
      currentItem = {
        files: files,
        order: order
      };
    }

    function openViewer(files, order) {
      setCurrentItem(files, order);

      var scope = $rootScope.$new(true);
      var template = $el('<esn-attachment-viewer></esn-attachment-viewer>');
      scope.file = files[order];
      elements.mainContent.html($compile(template)(scope));

      showInfo(scope.file.name, currentItem.order + 1, files.length);
      show(elements.loader);
      hide(elements.mainContent);
      show(elements.attachmentViewer);
    }

    function calculateSize(size) {
      var desiredSize = {};
      var windowWidth = $el($window).width();
      var windowHeight = $el($window).height();

      if (size.desiredRatio) {
      	calculateSizeByDesire();
      } else if (size.realSize) {
      	calculateSizeByReal();
      }

      function calculateSizeByDesire() {
        var ratioWindow = size.desiredRatio.defaultRatioWindow;

        angular.forEach(defaultOptions.screenWidth, function(value, key) {
          if (windowWidth > value && size.desiredRatio.defaultRatioWindow <= defaultOptions.minRatio[key]) {
            ratioWindow = defaultOptions.minRatio[key];
          }
        });
        if ((windowWidth / windowHeight) > size.desiredRatio.defaultRatioWH) {
          desiredSize.height = windowHeight * ratioWindow;
          desiredSize.width = parseInt(desiredSize.height * size.desiredRatio.defaultRatioWH, 10);
        } else {
          desiredSize.width = windowWidth * ratioWindow;
          desiredSize.height = parseInt(desiredSize.width / size.desiredRatio.defaultRatioWH, 10);
        }
      }

      function calculateSizeByReal() {
        var maxWidth = windowWidth - 100;
        var maxHeight = windowHeight - 140;
        var realWidth = size.realSize.width;
        var realHeight = size.realSize.height;

        if (realWidth === 0 && realHeight === 0) {
          desiredSize = defaultOptions.innitSize;
        } else {
          if ((realWidth > maxWidth) || (realHeight > maxHeight)) {
            if ((realWidth / maxWidth) > (realHeight / maxHeight)) {
              desiredSize.width = maxWidth;
              desiredSize.height = parseInt(realHeight / (realWidth / desiredSize.width), 10);
            } else {
              desiredSize.height = maxHeight;
              desiredSize.width = parseInt(realWidth / (realHeight / desiredSize.height), 10);
            }
          } else {
            desiredSize = size.realSize;
          }
        }
      }

      return desiredSize;
    }

    function resizeElements(desiredSize) {
      var windowWidth = $el($window).width();
      var windowHeight = $el($window).height();
      var newWidth = desiredSize.width;
      var newHeight = desiredSize.height;

      resizeOuterContainer();
      resizeTopBar();
      resizeViewer();
      resizeNav();

      function resizeOuterContainer() {
        elements.outerContainer.css({
          'width': newWidth + 'px',
          'height': newHeight + 'px'
        });
      }

      function resizeTopBar() {
        var minWidth = 0.2 * windowWidth;
        var topBarW = newWidth;
        if (topBarW < minWidth) {
          topBarW = minWidth;
        }
        elements.topBar.css({
          'width': topBarW + 'px'
        });
      }

      function resizeViewer() {
        var paddingTop = (windowHeight - newHeight) / 2 - elements.topBar.height();
        if (paddingTop < 0) {
          paddingTop = 0;
        }
        elements.attachmentViewer.css({
          'padding-top': paddingTop + 'px'
        });
      }

      function resizeNav() {
        var extraWidth = 0.1 * windowWidth;
        var navHeight = elements.nav.height();
        if (windowWidth < 700) {
          extraWidth = 0.22 * windowWidth;
        }
        elements.nav.css({
          'width': newWidth + extraWidth + 'px',
          'left': extraWidth / -2 + 'px',
          'top': (newHeight - navHeight - 2) / 2 + 'px'
        });
      }

      showContent();
    }

    function showContent() {
      hide(elements.loader);
      show(elements.mainContent);
    }

    function showInfo(title, order, total) {
      var caption = elements.topBar.find('.av-caption');
      var number = elements.topBar.find('.av-number');
      var totalText = (total > 1 ? ' files' : ' file');
      caption.text(title);
      number.text('File ' + order + ' in ' + total + totalText);
    }

    function show(elem) {
      elem.css({
        'display': 'block'
      });
    }

    function hide(elem) {
      elem.css({
        'display': 'none'
      });
    }

    // often use for pausing video whenever closing modal
    function onHide(callback) {
      elements.attachmentViewer.on('click', function() {
        if (elements.attachmentViewer.css('display') === 'none') {
          callback();
        }
      });
      elements.attachmentViewer.find('.av-closeContainer').on('click', function() {
        if (elements.attachmentViewer.css('display') === 'none') {
          callback();
        }
      });
    }


    function downloadFile(file) {
      $http({
        method: 'GET',
        url: file.url,
        responseType: "blob"
      }).then(function successCallback(response) {
        if (!response.data) {
          console.error('No data');
          return;
        }
        FileSaver.saveAs(response.data, file.name);
      }, function errorCallback(response) {
        console.log('Fail to get file');
      });
    }

  }

})();
