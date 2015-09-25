app.controller("loadViewController",
    function ($scope, $log, $window) {

        $scope.restart = function() {
            $window.location.reload();
        };

    });

