
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


app.run(function ($rootScope, $location,  $log, playlistService, actv8API) {

        $log.info("app.RUNning");

        $rootScope.$on('$routeChangeStart', function (event, next, current) {
            $log.info('$routeChangeStart');

        });

        // Note: cannot use file:// with node webkit
        actv8API.setSiteOrigin('http://127.0.0.1:1337');

        actv8API.authorize("admin", "p@ssw0rd")

            .then(function() {
                playlistService.init("https://commtix.appdelegates.net/ct/");
            })
    }
);