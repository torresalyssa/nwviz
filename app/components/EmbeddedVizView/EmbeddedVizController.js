app.controller("embeddedVizViewController",
    function ( $scope, $log, playlistService, $filter, $http, vizService) {

        $log.debug("Loading vizViewController");

        $scope.$on('VIZ_DONE', function() {
            playlistService.completed();
        });

        var item = playlistService.getCurrent();

        $scope.vizSrc = item.src;

    });

