app.controller("imageViewController",
    function ($scope, $log, playlistService, $timeout) {

        var item = playlistService.getCurrent();

        $scope.imgSrc = item.src;

        $timeout(playlistService.completed, parseInt(item.duration) * 1000);

    });

