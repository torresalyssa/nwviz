/**
 *
 * Functionality that is shared across entire app should be in here or a service.
 *
 * New > 1.2 Version
 *
 */


app.controller("rootController", function ($scope, $log, playlistService, userDefaults) {

        $log.debug("Loading rootController");


        $scope.$on("PLAYLIST_LOADED", function () {

            $log.info("Playlist loaded, whoohoo!");
            playlistService.sequence();

        });

        $scope.$on("BAD_PLAYLIST", function () {

            $log.error("Playlist is BAD, crap!");

        });

    });

