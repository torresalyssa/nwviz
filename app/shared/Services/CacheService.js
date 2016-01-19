app.factory('cacheService',
    function ($rootScope, $log, $q) {
        "use strict";

        var service = {};


        service.clear = function() {

            fs.emptyDir('cache', function(err) {

                if (!err) {
                    $rootScope.$broadcast('CACHE_EMPTY');
                }

                else {
                    $log.error('Error emptying cache: ' + err);
                    $rootScope.$broadcast('CACHE_NOT_EMPTY');
                }

            });

        };


        service.getFileAndPipe = function(src, dest) {

            var stream = fs.createOutputStream(dest);

            return $q(function(resolve, reject) {
                superagent
                    .get(src)
                    .end(function(err) {

                        if (err) {
                            reject('GET_ERROR');
                        }

                        else {
                            var request = superagent.get(src);

                            request.pipe(stream)
                                .on('error', function () {
                                    reject('Error writing ' + src + ' to ' + dest);
                                })

                                .on('finish', function () {
                                    resolve('Writing file to ' + dest + ' successful');
                                });
                        }
                    });
            });
        };


        service.unzipAndPipe = function(src, dest) {

            return $q(function(resolve, reject) {
                superagent
                    .get(src)
                    .end(function(err) {

                        if(err) {
                            reject('GET_ERROR');
                        }

                        else {

                            var request = superagent.get(src);

                            request.pipe(unzip.Extract({path: dest}))
                                .on('error', function() {
                                    reject('Error unzipping file at ' + src);
                                })

                                .on('finish', function() {
                                    resolve('Writing file to ' + dest + ' successful');
                                });
                        }

                    });
            });
        };


        service.extractTarAndPipe = function(src, dest) {

            return $q(function(resolve, reject) {
                superagent
                    .get(src)
                    .end(function(err) {

                        if(err) {
                            reject('GET_ERROR');
                        }

                        else {
                            var request = superagent.get(src);

                            request.pipe(tar.extract(dest))
                                .on('error', function() {
                                    reject('Error extracting file at ' + src);
                                })

                                .on('finish', function() {
                                    resolve('Writing file to ' + dest + ' successful');
                                });
                        }

                    });
            });
        };


        service.gunzipAndExtract = function(src, dest) {

            return $q(function(resolve, reject) {
                superagent
                    .get(src)
                    .end(function(err) {

                        if(err) {
                            reject('GET_ERROR');
                        }

                        else {
                            var request = superagent.get(src);

                            request.pipe(gunzip()).pipe(tar.extract(dest))
                                .on('error', function() {
                                    reject('Error gunzipping file at ' + src);
                                })

                                .on('finish', function() {
                                    resolve('Writing file to ' + dest + ' successful');
                                });
                        }

                    });
            });
        };

        return service;

    }
);