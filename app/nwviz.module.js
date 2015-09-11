
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



app.config(function($sceDelegateProvider) {

    console.info("app.CONFIGing");

    $sceDelegateProvider.resourceUrlWhitelist([
        'self',
        'https://commtix.appdelegates.net/**'
    ]);
});


app.run(function ($rootScope, $location, $log, playlistService, $timeout, actv8API, cacheService, userDefaults) {

        var a8Ip = userDefaults.getStringForKey("a8Ip", "127.0.0.1");
        var cmsAddr = userDefaults.getStringForKey("cmsAddr", "https://commtix.appdelegates.net/ct/");
        var venueId = userDefaults.getStringForKey("venueId", "0");

        var a8Origin = 'http://' + a8Ip + ':1337';

        userDefaults.setStringForKey('a8Ip', a8Ip);
        userDefaults.setStringForKey('cmsAddr', cmsAddr);
        userDefaults.setStringForKey('venueId', venueId);

        $rootScope.$on('NOT-AUTHORIZED', function() {
            $rootScope.loadingMsg = 'Error logging in to Activ8or. Make sure your credentials are correct and you have Activ8or running on ' + a8Origin + '. Press ESC to configure options.';
        });

        $rootScope.$on('CACHE_EMPTY', function() {
            playlistService.init(cmsAddr);
        });

        $rootScope.loadingMsg = 'Logging in to Activ8or';
        $timeout(function () {
            $location.path('loading')
        });

        // Note: cannot use file:// with node webkit
        actv8API.setSiteOrigin(a8Origin);

        // a8 login info here
        actv8API.authorize()

            .then(function() {
                cacheService.clear();
            })
    }
);