
/*********************************

 File:       angviz.module
 Function:   Base App
 Copyright:  AppDelegates LLC
 Date:       3/10/15
 Author:     atorres

 **********************************/

var app = angular.module('nwVizApp', [
    'ngRoute', 'ngSanitize',
    'ngAnimate', 'ui.event',
    'userdefaults.service', 'ngActiv8'])



app.config(function() {
    console.info("app.CONFIGing");
});


app.run(function ($sce, $rootScope, $location, $log, playlistService, $timeout, actv8API, cacheService, userDefaults) {

        var configs;
        var a8Origin, cmsAddr, venueId;

        $rootScope.loadingMsg = 'Getting configuration';
        $timeout(function () {
            $location.path('loading')
        });

        fs.readJson("locals/config.json", function(err, object) {

            if (err) {
                $log.info("No local config.json file found. Using default config.json.");

                fs.readJson("config.json", function(err, object) {
                    if (err) {
                        $log.error("No config.json file was found");
                        $rootScope.loadingMsg("No config.json file was found. Please add one!");
                    }
                    else {
                        configs = object;
                        $rootScope.$broadcast('CONFIGS_LOADED');
                    }
                });
            }

            else {
                configs = object;
                $rootScope.$broadcast('CONFIGS_LOADED');
            }
        });


        $rootScope.$on('CONFIGS_LOADED', function() {

            var a8Ip = userDefaults.getStringForKey("a8Ip", configs.defaultA8Ip);

            venueId = userDefaults.getStringForKey("venueId", configs.defaultVenueId);
            cmsAddr = userDefaults.getStringForKey("cmsAddr", configs.defaultCmsAddr);
            a8Origin = 'http://' + a8Ip + ':1337';

            userDefaults.setStringForKey('a8Ip', a8Ip);
            userDefaults.setStringForKey('cmsAddr', cmsAddr);
            userDefaults.setStringForKey('venueId', venueId);

            $rootScope.loadingMsg = 'Logging in to Activ8or';

            // Note: cannot use file:// with node webkit
            actv8API.setSiteOrigin(a8Origin);

            actv8API.authorize(configs.a8uname, configs.a8pwd)

                .then(function () {
                    cacheService.clear();

                }, function() {
                    $log.warn("Not able to log in to Activ8or.");
                })
        });

        $rootScope.$on('NOT_AUTHORIZED', function() {
            $rootScope.loadingMsg = 'Error logging in to Activ8or. Make sure your credentials are correct and you have Activ8or running on ' + a8Origin + '.';
            $timeout(cacheService.clear, 4000);
        });

        $rootScope.$on('CACHE_EMPTY', function() {
            $rootScope.loadingMsg = 'Cache successfully emptied.';
            playlistService.init(cmsAddr, configs);
        });

        $rootScope.$on('CACHE_NOT_EMPTY', function() {
            $rootScope.loadingMsg = 'Error emptying cache. Try restarting.';
        });

    }
);