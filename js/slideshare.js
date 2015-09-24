angular.module('openpaas-site')
.directive('slideshare', ['$http', function($http) {
  function link(scope, element) {
    var slideShareURL = element.attr("href");
    var data = {
      url: slideShareURL,
      format: "jsonp",
      callback: "JSON_CALLBACK"
    };
    element.hide();
    $http.jsonp('http://www.slideshare.net/api/oembed/2', {
      params: data
    })
    .then(function(response) {
      element.replaceWith(response.data.html);
    }, function(err) {
      console.log(err);
    });
  }
  return {
    restrict: 'A',
    link: link
  };
}]);
