/**
 * Created by mkahn on 8/21/15.
 */

app.factory('playlistService',
    function ($rootScope, $location, $timeout, $log, $http, cacheService, $q) {
        "use strict";

        var service = {};

        var _index = 0;

        var path;
        var playlistExt = 'viz-playlist-rest';
        var tokenExt = 'services/session/token';
        var loginExt = 'user/login.json';
        var mediaExt = 'api/v1/node/';
        var mediaFilesExt = 'sites/default/files/';

        var _nodes;
        var _i;

        service.playlist = [];
        service.playlistValid = false;

        function getToken() {
           return $http.get(path + tokenExt)
                .then(function(data) {
                    $log.info("Got token");
                    $http.defaults.headers.common["X-CSRF-Token"] = data.data;
                    return true;
                })
        }


        service.login = function() {
            var p = path + 'api/v1/' + loginExt;
            var deferred = $q.defer();

            getToken()
                .then(function() {
                    superagent
                        .post(p)

                        // Put in commtix credentials here
                        .send()

                        .set('X-CSRF-Token', $http.defaults.headers.common["X-CSRF-Token"])
                        .set('Accept', 'application/json')
                        .end(function (err, res) {
                            if(err) {
                                deferred.reject('Error logging in to Commtix. Make sure credentials are correct.');
                            } else {
                                deferred.resolve({data: res});
                            }
                        })
                });

            return deferred.promise;
        };

        service.init = function (endpoint) {
            var nodes, tmp;
            path = endpoint;

            $rootScope.loadingMsg = "Logging in to Commtix";

            service.login()

                .then(function () {
                    $http.get(path + playlistExt)

                        .then(function (data) {

                            tmp = data.data.nodes[0].node['Media Items'];
                            nodes = tmp.split(" ");

                            _nodes = nodes;
                            _i = 0;

                            $rootScope.loadingMsg = "Processing playlist";

                            service.processPlaylist();

                        }, function(error) {
                            $rootScope.loadingMsg = "Could not load playlist. Make sure you have a playlist up on " + endpoint;
                        })


                }, function(error) {
                    $log.error(error);
                    $rootScope.loadingMsg = error;
                })

        };

        service.processPlaylist = function() {

            var i = _i;
            var n;

            if (i < _nodes.length) {
                n = i + 1;
                $rootScope.loadingMsg = 'Loading file ' + n + ' out of ' + _nodes.length;
                service.getMediaData(parseInt(_nodes[i]));
            }

            if (i == _nodes.length) {

                if (service.playlist.length > 0) {
                    service.playlistValid = true;

                    _index = 0;
                    $rootScope.$broadcast('PLAYLIST_LOADED');
                }

                else {
                    service.playlistValid = false;
                    $log.error('Media for playlist did not load properly.');
                    $rootScope.loadingMsg = 'Media for playlist did not load properly. Either the playlist is empty or there was an issue getting the individual media items. Check https://commtix.appdelegates.net to make sure you have a valid playlist loaded.';
                }
            }

            _i++;
        };

        service.getMediaData = function(nodeNum) {

            var current = {
                src: undefined,
                type: undefined,
                duration: 30000,
                supported: true
            };

            var src, dest, filetype;

            $http.get(path + mediaExt + nodeNum + '.json')

                .then(function(data) {

                    current.type = data.data.type;

                    switch (current.type) {

                        case 'visualizer_image':
                            src = path + mediaFilesExt + data.data['field_viz_image'].und[0].uri.replace('public://', '');
                            dest = 'cache/images/' + data.data['field_viz_image'].und[0].filename;

                            current.src = dest;
                            current.duration = data.data['field_duration'].und[0].value;

                            cacheService.getFileAndPipe(src, dest)
                                .then(
                                function(success) {
                                    $log.info(success);
                                    service.processPlaylist();
                                },
                                function(error) {
                                    $log.error(error);
                                    current.supported = false;
                                    $rootScope.loadingMsg = 'Image file at ' + src + ' could not be found. Make sure the file is uploaded and included in the playlist properly.';
                                    //service.processPlaylist();
                                });
                            break;

                        case 'visualizer_video':
                            src = path + mediaFilesExt + data.data['field_video'].und[0].uri.replace('public://', '');
                            dest = 'cache/videos/' + data.data['field_video'].und[0].filename;

                            current.src = dest;

                            cacheService.getFileAndPipe(src, dest)
                                .then(
                                function(success) {
                                    $log.info(success);
                                    service.processPlaylist();
                                },
                                function(error) {
                                    $log.error(error);
                                    current.supported = false;
                                    $rootScope.loadingMsg = 'Video file at ' + src + ' could not be found. Make sure the file is uploaded and included in the playlist properly.';
                                    //service.processPlaylist();
                                });
                            break;

                        case 'visualizer_js':
                            src = path + mediaFilesExt + data.data['field_js_file'].und[0].uri.replace('public://', '');
                            filetype = data.data['field_js_file'].und[0].filemime;

                            if (filetype == 'application/zip') {
                                current.type = 'visualizer_pkg';

                                dest = 'cache/viz';
                                current.src = dest + '/' + data.data['field_js_file'].und[0].filename.replace('.zip', '') + '/index.html';

                                cacheService.unzipAndPipe(src, dest)
                                    .then(
                                    function(success) {
                                        $log.info(success);
                                        service.processPlaylist();
                                    },
                                    function(error) {
                                        $log.error(error);
                                        current.supported = false;

                                        if (error == 'GET_ERROR') {
                                            $rootScope.loadingMsg = 'Visualizer file at ' + src + ' could not be found. Make sure the file is uploaded and included in the playlist properly.';
                                        }
                                        else {
                                            $rootScope.loadingMsg = 'Error unzipping file ' + src + '. Try restarting or using a .tgz file instead.';
                                        }

                                        //service.processPlaylist();
                                    });
                            }

                            else if (filetype == 'application/x-tar'){
                                current.type = 'visualizer_pkg';

                                dest = 'cache/viz';
                                current.src = dest + '/' + data.data['field_js_file'].und[0].filename.replace('.tar', '') + '/index.html';

                                cacheService.extractTarAndPipe(src, dest)
                                    .then(
                                    function(success) {
                                        $log.info(success);
                                        service.processPlaylist();
                                    },
                                    function(error) {
                                        $log.error(error);
                                        current.supported = false;

                                        if (error == 'GET_ERROR') {
                                            $rootScope.loadingMsg = 'Visualizer file at ' + src + ' could not be found. Make sure the file is uploaded and included in the playlist properly.';
                                        }
                                        else {
                                            $rootScope.loadingMsg = 'Error extracting file ' + src + '. Try restarting.';
                                        }

                                        //service.processPlaylist();
                                    });
                            }

                            else if (filetype == 'application/x-gtar'){
                                current.type = 'visualizer_pkg';

                                dest = 'cache/viz';
                                current.src = dest + '/' + data.data['field_js_file'].und[0].filename.replace('.tgz', '') + '/index.html';

                                cacheService.gunzipAndExtract(src, dest)
                                    .then(
                                    function(success) {
                                        $log.info(success);
                                        service.processPlaylist();
                                    },
                                    function(error) {
                                        $log.error(error);
                                        current.supported = false;

                                        if (error == 'GET_ERROR') {
                                            $rootScope.loadingMsg = 'Visualizer file at ' + src + ' could not be found. Make sure the file is uploaded and included in the playlist properly.';
                                        }
                                        else {
                                            $rootScope.loadingMsg = 'Error extracting file ' + src + '. Try restarting.';
                                        }

                                        //service.processPlaylist();
                                    });
                            }

                            else if (filetype == 'application/js'){
                                dest = 'cache/js/' + data.data['field_js_file'].und[0].filename.replace('.txt', '');
                                current.src = dest;

                                cacheService.getFileAndPipe(src, dest)
                                    .then(
                                    function(success) {
                                        $log.info(success);
                                        service.processPlaylist();
                                    },
                                    function(error) {
                                        $log.error(error);
                                        current.supported = false;
                                        $rootScope.loadingMsg = 'JS file at ' + src + ' could not be found. Make sure the file is uploaded and included in the playlist properly.';
                                        //service.processPlaylist();
                                    });
                            }

                            break;

                        default:
                            current.supported = false;
                            $log.error("Unsupported type (" + current.type + ") detected in playlist.");
                            break;

                    }

                    if(current.supported) {
                        service.playlist.push(current);
                    }

                },

                function(error) {

                    $log.error('Error getting media information from: ' + path + mediaExt + nodeNum + '.json' + '\nProcessing next media item.');
                    service.processPlaylist();

                })
        };


        service.getLength = function () {
            return service.playlist.length;
        };

        service.getIndex = function () {
            return _index;
        };

        service.getCurrent = function () {

            return service.playlist[_index];

        };

        service.next = function () {

            _index++;

            if (_index === service.playlist.length) {
                _index = 0;
                $rootScope.$broadcast('WRAP_PLAYLIST');

            }

            return _index;

        };

        service.sequence = function () {

            var nextItem = service.getCurrent();
            $log.info("Getting ready to play: " + nextItem.src);

            switch (nextItem.type) {

                case 'visualizer_image':
                    $timeout(function () {
                        $location.path('image/' + _index)
                    });
                    break;

                case 'visualizer_video':
                    $timeout(function () {
                        $location.path('video/' + _index)
                    });
                    break;

                case 'visualizer_js':
                    $timeout(function () {
                        $location.path('viz/' + _index)
                    });
                    break;

                case 'visualizer_pkg':
                    $timeout(function () {
                        $location.path('eviz/' + _index)
                    });
                    break;

                default:
                    //This shouldn't crash in production
                    throw new Error("Malformed JSON, you dope. Unrecognized type: " + nextItem.type);

            }


        };

        service.completed = function () {

            service.next();
            service.sequence();

        };

        return service;


    });
