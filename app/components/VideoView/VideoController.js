app.controller("videoViewController",
    function ( $scope, $log, $timeout, playlistService ) {

        var item = playlistService.getCurrent();

        $scope.currentItem = item;

        $scope.vidSrc = item.src;

        $scope.videoDone = function() {
            playlistService.completed();
        }

    }
);
