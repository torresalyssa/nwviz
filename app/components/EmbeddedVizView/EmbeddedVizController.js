app.controller("embeddedVizViewController",
    function ( $scope, $log, playlistService, $timeout) {

        $scope.$on('VIZ_DONE', function() {
            playlistService.completed();
        });

        var item = playlistService.getCurrent();

        $scope.vizSrc = item.src;
        $scope.vizMsg = '';


        fs.stat(item.src, function(err){
            var vizName = item.src.replace('cache/viz', '').replace('/index.html', '');
            if (err) {
                $scope.vizMsg = "Error loading 'index.html' for the visualizer " + vizName + ". Make sure your visualizer has a file named index.html in its root directory.";
            }

            else {
                $scope.vizMsg = "Error with embedding the visualizer. Check that the JS visualizer " + vizName + " is node-webkit compatible.";

                $log.info("HEY! Are things not looking the way you think they should? If accessing Activ8or in the visualizer, you must check userDefaults for 'a8Ip' and set that as Activ8or's site origin using" +
                    "the node-webkit compatible format http://[a8Ip]:1337.");
            }
        });


        fs.readJson(item.src.replace('index.html', 'info.json'), function(err, object) {

            if (err) {
                $log.error("Visualizer does not contain 'info.json' in its root. Using default time of 30s.");
            }

            else {
                item.duration = object.duration;
            }

            $timeout(playlistService.completed, parseInt(item.duration));
        })

    });


