app.controller("configViewController",
    function ($scope, $log, $timeout, $window, userDefaults) {

        $scope.vizSettings = {
            a8Ip: undefined,
            cmsAddr: undefined,
            venueId: undefined
        };

        $scope.vizSettings.a8Ip = userDefaults.getStringForKey("a8Ip", "127.0.0.1");
        $scope.vizSettings.cmsAddr = userDefaults.getStringForKey("cmsAddr", "https://commtix.appdelegates.net/ct/");
        $scope.vizSettings.venueId = userDefaults.getStringForKey("venueId", "0");

        $scope.venueIdRegex = /^\d+$/;
        $scope.ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

        $scope.ready = true;

        $scope.$watch("vizSettings.a8Ip", function(nval) {

            if (!nval)
                return;

            userDefaults.setStringForKey("a8Ip", nval);
        });

        $scope.$watch("vizSettings.cmsAddr", function(nval) {

            if (!nval)
                return;

            nval += nval.slice(-1) == '/' ? "" : "/";

            userDefaults.setStringForKey("cmsAddr", nval);
        });

        $scope.$watch("vizSettings.venueId", function(nval) {

            if (!nval)
                return;

            userDefaults.setStringForKey("venueId", nval);
        });

        $scope.onApply = function() {
            $window.location.reload();
        };

        $scope.onReset = function() {
            $scope.vizSettings.a8Ip = "127.0.0.1";
            $scope.vizSettings.cmsAddr = "https://commtix.appdelegates.net/ct/";
            $scope.vizSettings.venueId = "0";
        };

    });

