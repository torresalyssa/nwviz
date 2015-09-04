app.controller("embeddedVizViewController",
    function ( $scope, $log, playlistService, $timeout) {

        $log.debug("Loading vizViewController");

        $scope.$on('VIZ_DONE', function() {
            playlistService.completed();
        });

        var item = playlistService.getCurrent();

        $scope.vizSrc = item.src;

        $timeout(playlistService.completed, 20000);

    });

