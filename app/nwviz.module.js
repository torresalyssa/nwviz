/*********************************

 File:       nwviz.module
 Function:   Base App
 Copyright:  AppDelegates LLC
 Date:       3/10/15
 Author:     atorres

 **********************************/

var app = angular.module('nwVizApp', [
    'ngRoute', 'ngSanitize',
    'ngAnimate', 'ui.event',
    'userdefaults.service',
    'ngActiv8orLite'])


app.config(function ($httpProvider) {
    console.info("app.CONFIGing");
});


app.run(function ($rootScope, $location, $log, playlistService, $timeout, actv8API, cacheService, userDefaults) {

    var a8Origin, cmsAddr, venueId;

    $rootScope.configs = undefined;

    $rootScope.errorMsg = "";
    $rootScope.fatalError = false;

    $rootScope.loadingMsg = 'Getting configuration';

    $timeout(function () {
        $location.path('loading')
    });

    fs.readJson("locals/config.json", function (err, object) {

        if (err) {
            $log.info("No local config.json file found. Using default config.json.");


            fs.readJson("config.json", function (err, object) {
                if (err) {
                    $log.error("No config.json file was found");
                    $rootScope.errorMsg = "No config.json file was found. Please add one!";
                    $rootScope.$broadcast('FATAL_ERROR');
                }
                else {
                    try {
                        object.a8uname.x;
                        object.a8pwd.x;
                        object.cmsuname.x;
                        object.cmspwd.x;
                        object.defaultCmsAddr.x;
                        object.defaultA8Ip.x;

                        $rootScope.configs = object;
                        $rootScope.$broadcast('CONFIGS_LOADED');
                    }
                    catch (err) {
                        $log.error("config.json is malformed");
                        $rootScope.errorMsg = "The config.json file is missing necessary fields.";
                        $rootScope.$broadcast('FATAL_ERROR');
                    }
                }
            });
        }

        else {
            try {
                object.a8uname.x;
                object.a8pwd.x;
                object.cmsuname.x;
                object.cmspwd.x;
                object.defaultCmsAddr.x;
                object.defaultA8Ip.x;

                $rootScope.configs = object;
                $rootScope.$broadcast('CONFIGS_LOADED');
            }
            catch (err) {
                $log.error("config.json is malformed");
                $rootScope.errorMsg = "The config.json file is missing necessary fields.";
                $rootScope.$broadcast('FATAL_ERROR');
            }
        }
    });

    // Done as a listener so it is easily called from other controllers
    $rootScope.$on('CONFIGS_LOADED', function () {

        var a8Ip = userDefaults.getStringForKey("a8Ip", $rootScope.configs.defaultA8Ip);


        venueId = userDefaults.getStringForKey("venueId", $rootScope.configs.defaultVenueId);
        cmsAddr = userDefaults.getStringForKey("cmsAddr", $rootScope.configs.defaultCmsAddr);
        a8Origin = 'http://' + a8Ip + ':1337';

        userDefaults.setStringForKey('a8Ip', a8Ip);
        userDefaults.setStringForKey('cmsAddr', cmsAddr);
        userDefaults.setStringForKey('venueId', venueId);

        $rootScope.loadingMsg = 'Logging in to Activ8or';

        // Note: cannot use file:// with node webkit
        actv8API.setSiteOrigin(a8Origin);


        // More concise, the way the cool kids roll
        actv8API.authorize($rootScope.configs.a8uname, $rootScope.configs.a8pwd).then(cacheService.clear);
    });

    $rootScope.$on('NOT_AUTHORIZED', function () {
        $rootScope.loadingMsg = 'Error logging in to Activ8or. Make sure your credentials are correct and you have Activ8or running on '
            + a8Origin + '. Press ESC to change the Activ8or IP address. Continuing app...';
        $timeout(cacheService.clear, 5000);
    });

    $rootScope.$on('CACHE_EMPTY', function () {
        $rootScope.loadingMsg = 'Cache successfully emptied.';
        playlistService.init(cmsAddr);
    });

    $rootScope.$on('CACHE_NOT_EMPTY', function () {
        $rootScope.errorMsg = 'Error emptying cache. Try restarting.';
        $rootScope.$broadcast('FATAL_ERROR');
    });

    $rootScope.$on('FATAL_ERROR', function () {
        $rootScope.fatalError = true;
    })

});
