app.controller("configViewController",
    function ($rootScope, $scope, $log, $timeout, $window, userDefaults) {

        $scope.vizSettings = {
            a8Ip: undefined,
            cmsAddr: undefined,
            venueId: undefined
        };

        $scope.vizSettings.a8Ip = userDefaults.getStringForKey("a8Ip", $rootScope.configs.defaultA8Ip);
        $scope.vizSettings.cmsAddr = userDefaults.getStringForKey("cmsAddr", $rootScope.configs.defaultCmsAddr);
        $scope.vizSettings.venueId = userDefaults.getStringForKey("venueId", $rootScope.configs.defaultVenueId);

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
            $scope.vizSettings.a8Ip = $rootScope.configs.defaultA8Ip;
            $scope.vizSettings.cmsAddr = $rootScope.configs.defaultCmsAddr;
            $scope.vizSettings.venueId = $rootScope.configs.defaultVenueId;
        };

    });

