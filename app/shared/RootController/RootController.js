/**
 *
 * Functionality that is shared across entire app should be in here or a service.
 *
 * New > 1.2 Version
 *
 */


app.controller("rootController", function ($scope, $log, playlistService, $timeout, $location) {

    $scope.$on("PLAYLIST_LOADED", function () {

        $log.info("Playlist loaded");
        playlistService.sequence();

    });

    $scope.onKeyDown = function($event) {
        var keyCode = window.event ? $event.keyCode : $event.which;

        // if ESC key is pressed
        if (keyCode === 27) {
            playlistService.stop();
            $timeout(function () { $location.path('config') });
        }
    }

});

