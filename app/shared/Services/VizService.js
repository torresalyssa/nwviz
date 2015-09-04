app.factory('vizService',
    function ($rootScope, $log, $timeout, $document, userDefaults) {
        "use strict";

        var service = {};

        var _loadedScripts = {};

        service.startViz = function (vizSrc, imgData) {

            if (!_loadedScripts[vizSrc]) {

                $log.info("Loading  " + vizSrc);
                var script = $document[0].createElement("script");
                script.src = vizSrc;

                $document[0].head.appendChild(script);

                script.onload = function () {
                    _loadedScripts[vizSrc] = true;

                    try {
                        runScene(imgData, $rootScope, userDefaults);
                    }
                    catch (error) {
                        $log.error(error);
                        $rootScope.$broadcast('VIZ_DONE');
                    }
                };

                script.onerror = function() {
                   $log.error("Viz file " + vizSrc + " failed to load.");
                    $rootScope.$broadcast('VIZ_DONE');
                };
            }

            else {

                $log.info("Script " + vizSrc + " already loaded, running scene");

                try {
                    runScene(imgData, $rootScope, userDefaults);
                }
                catch (error) {
                    $log.error(error);
                    $rootScope.$broadcast('VIZ_DONE');
                }
            }
        };

        return service;

    });
