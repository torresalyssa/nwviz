app.controller("videoViewController",
    function ( $scope, $log, $timeout, playlistService ) {

        $log.debug("Loading videoViewController");

        var item = playlistService.getCurrent();

        $scope.vidSrc = item.src;

        /*
        $scope.videoDone = function() {
            playlistService.completed();
        }
        */


        // In as placeholder until video works
        $timeout(playlistService.completed, 3000);
    }
);
