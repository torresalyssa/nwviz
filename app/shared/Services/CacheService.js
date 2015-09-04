app.factory('cacheService',
    function ($rootScope, $log) {
        "use strict";

        var service = {};

        service.getFileAndPipe = function(src, dest, callback) {

            $log.info("Writing file at " + src + " to " + dest);

            var stream = fs.createWriteStream(dest);

            var request = superagent
                .get(src)
                .end(function(err) {
                    if (err) {
                        $log.error("Error getting file from: " + src);
                    }
                });

            request.pipe(stream);

            if(typeof callback == 'function') {
                request.on('end', callback);
            }
        };

        service.unzipAndPipe = function(src, dest, callback) {

            $log.info("Unzipping file at " + src + " to " + dest);

            var request = superagent
                .get(src)
                .end(function(err) {
                    if (err) {
                        $log.error("Error getting file from: " + src);
                    }
                });

            request.pipe(unzip.Extract({path: dest}));

            if(typeof callback == 'function') {
                request.on('end', callback);
            }
        };

        service.extractTarAndPipe = function(src, dest, callback) {

            $log.info("Extracting tarball at " + src + " to " + dest);

            var request = superagent
                .get(src)
                .end(function(err) {
                    if (err) {
                        $log.error("Error getting file from: " + src);
                    }
                });

            request.pipe(tar.extract(dest));

            if(typeof callback == 'function') {
                request.on('end', callback);
            }
        };

        service.gunzipAndExtract = function(src, dest, callback) {

            $log.info("gunzipping " + src + " to " + dest);

            var request = superagent
                .get(src)
                .end(function(err) {
                    if (err) {
                        $log.error("Error getting file from: " + src);
                    }
                });

            request.pipe(gunzip()).pipe(tar.extract(dest));

            if(typeof callback == 'function') {
                request.on('end', callback);
            }

        };

        return service;

    }
);