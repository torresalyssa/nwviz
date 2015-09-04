
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


app.run(function ($rootScope, $location,  $log, playlistService, $timeout, actv8API) {

        var a8Origin = 'http://127.0.0.1:1337';

        $log.info("app.RUNning");

        $rootScope.$on('$routeChangeStart', function (event, next, current) {
            $log.info('$routeChangeStart');

        });

        $rootScope.$on('NOT-AUTHORIZED', function() {
            $rootScope.loadingMsg = 'Error logging in to Activ8or. Make sure your credentials are correct and you have Activ8or running on ' + a8Origin + '.';
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
                playlistService.init("https://commtix.appdelegates.net/ct/");
            })
    }
);