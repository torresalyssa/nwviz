app.directive('fallbackSrc', function($timeout, $location) {

    return {
        link: function(scope, element, attrs) {
            var defaultSrc = attrs.fallbackSrc ? attrs.fallbackSrc : "assets/img/default.jpg";

            element.on('error', function() {
                element.off('error');
                console.log('ERROR loading primary source');
                element[0].src = defaultSrc;

                if (element[0].localName == 'video') {
                    scope.currentItem.src = defaultSrc;
                    scope.currentItem.duration = 3;

                    $timeout(function () {
                        $location.path('image/' + 9999)
                    });
                }
            });
        }
    };

});