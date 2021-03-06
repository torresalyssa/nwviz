app.controller("vizViewController",
    function ( $scope, $log, playlistService, $filter, $http, vizService, actv8API ) {

        $scope.$on('VIZ_DONE', function() {
            playlistService.completed();
        });

        var item = playlistService.getCurrent();

        var imgNum = 10;
        var length;


        actv8API.getInstagramMedia()

            .then(function(data) {

                var imgData = [];

                var photos = data.data;

                photos.forEach( function(photo){

                    var isFlagged= photo.flags.inappropriate;

                    if (!isFlagged ){
                        imgData.push({
                            url: actv8API.getSiteOrigin() + photo.url,
                            createdAt: photo.createdAt
                        });
                    }

                });

                //Hack to get at least 2 in the pipe
                if (imgData.length == 1){
                    imgData.push(imgData[0]);
                }

                imgData = $filter('orderBy')(imgData, "-createdAt");

                length = imgData.length;

                while (length > imgNum) {
                    imgData.pop();
                    length--;
                }

                vizService.startViz(item.src, imgData);
            })

            .catch(function(err) {
                $log.error("Could not get image data for visual at " + item.src + ": " + err);
                playlistService.completed();
            });

    });

