app.factory('cacheService',
    function ($rootScope, $log, $q) {
        "use strict";

        var service = {};


        service.clear = function() {

            fs.emptyDir('cache', function(err) {

                if (!err) {
                    $rootScope.loadingMsg = 'Cache successfully emptied.';
                    $rootScope.$broadcast('CACHE_EMPTY');
                }

                else {
                    $rootScope.loadingMsg = 'Error emptying cache. Try restarting.';
                    $log.error('Error emptying cache: ' + err);
                }

            });

        };


        service.getFileAndPipe = function(src, dest) {

            var deferred = $q.defer();

            var stream = fs.createOutputStream(dest);

            superagent
                .get(src)
                .end(function(err) {

                    if (err) {
                        deferred.reject('GET_ERROR');
                    }

                    else {
                        var request = superagent.get(src);

                        request.pipe(stream)
                            .on('error', function () {
                                deferred.reject('Error writing ' + src + ' to ' + dest);
                            })

                            .on('finish', function () {
                                deferred.resolve('Writing file to ' + dest + ' successful');
                            });
                    }
                });


           return deferred.promise;
        };


        service.unzipAndPipe = function(src, dest) {

            var deferred = $q.defer();
            var localZip = dest + 'temp.zip';
            var request;

            superagent
                .get(src)
                .end(function(err) {

                    if(err) {
                        deferred.reject('GET_ERROR');
                    }

                    else {

                        request = superagent.get(src);

                        request.pipe(unzip.Extract({path: dest}))
                            .on('error', function() {
                                deferred.reject('Error unzipping file at ' + src);
                            })

                            .on('finish', function() {
                                deferred.resolve('Writing file to ' + dest + ' successful');
                            });
                    }

                });


            return deferred.promise;

        };


        service.extractTarAndPipe = function(src, dest) {

            var deferred = $q.defer();

            superagent
                .get(src)
                .end(function(err) {

                    if(err) {
                        deferred.reject('GET_ERROR');
                    }

                    else {
                        var request = superagent.get(src);

                        request.pipe(tar.extract(dest))
                            .on('error', function() {
                                deferred.reject('Error extracting file at ' + src);
                            })

                            .on('finish', function() {
                                deferred.resolve('Writing file to ' + dest + ' successful');
                            });
                    }

                });


            return deferred.promise;
        };


        service.gunzipAndExtract = function(src, dest) {

            var deferred = $q.defer();

            superagent
                .get(src)
                .end(function(err) {

                    if(err) {
                        deferred.reject('GET_ERROR');
                    }

                    else {
                        var request = superagent.get(src);

                        request.pipe(gunzip()).pipe(tar.extract(dest))
                            .on('error', function() {
                                deferred.reject('Error gunzipping file at ' + src);
                            })

                            .on('finish', function() {
                                deferred.resolve('Writing file to ' + dest + ' successful');
                            });
                    }

                });


            return deferred.promise;

        };

        return service;

    }
);