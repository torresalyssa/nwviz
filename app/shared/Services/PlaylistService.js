app.factory('playlistService',
    function ($rootScope, $location, $timeout, $log, $http, cacheService, $q, userDefaults) {
        "use strict";

        var service = {};

        var _index = 0;

        var path;
        var playlistExt = 'viz-playlist-rest';
        var tokenExt = 'services/session/token';
        var loginExt = 'api/v1/user/login.json';
        var mediaExt = 'api/v1/node/';
        var mediaFilesExt = 'sites/default/files/';

        var _nodes;
        var _i;

        var _stop = false;

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

            var deferred = $q.defer();

            //MAK, discovered getting the token should not be necessary, but need to test
            //getToken()
             //   .then(function() {
                    superagent
                        .post(path + loginExt)

                        .send({username: $rootScope.configs.cmsuname, password: $rootScope.configs.cmspwd})

                        //.set('X-CSRF-Token', $http.defaults.headers.common["X-CSRF-Token"])
                        .set('Accept', 'application/json')
                        .end(function (err, res) {
                            if(err) {
                                deferred.reject('Error logging in to the content management system. '
                                    + 'Make sure credentials and CMS address are correct and you have an internet connection. Press ESC to configure CMS address.');
                            } else {
                                deferred.resolve({data: res});
                            }
                        })

               // }, function(error) {
               //     deferred.reject('Error logging in to the content management system. Make sure credentials are correct. Press ESC to configure CMS address.');
               // });

            return deferred.promise;
        };

        service.init = function (endpoint) {
            var nodes, tmp;
            var venueId, playlistJSON;
            path = endpoint;

            $rootScope.loadingMsg = "Logging in to CMS";

            service.login()

                .then(function () {
                    $http.get(path + playlistExt)

                        .then(function (data) {

                            // get desired playlist by venue id
                            // TODO: Playlists are listed without unique ids on commtix, so how do we choose which one?
                            venueId = parseInt(userDefaults.getStringForKey("venueId", $rootScope.configs.defaultVenueId));

                            if (!venueId && venueId != 0) {
                                $log.error("Error: invalid venue id " + venueId);
                                $rootScope.loadingMsg = "Error: Invalid venue ID." +
                                    " Venue ID must be a number. Press ESC to reconfigure.";
                                return;
                            }

                            try {
                                playlistJSON = data.data.nodes[venueId].node;
                            }
                            catch(err) {
                                $log.error("Error: Playlist at index venueId does not exist.");
                                $rootScope.loadingMsg = "Error: No playlist exists for venue ID " + venueId +
                                        ". Press ESC to enter a different venue ID.";
                                return;
                            }


                            // get media item node ids for the playlist
                            try {
                                tmp = playlistJSON['Media Items'];
                            }
                            catch(err) {
                                $log.error("Error: Playlist JSON is malformed. " + err);
                                $rootScope.loadingMsg = "Error: Playlist JSON at " + path + playlistExt + " is malformed.";
                                return;
                            }

                            if (typeof tmp !== 'string') {
                                $log.error("Error: Playlist JSON is malformed. ");
                                $rootScope.loadingMsg = "Error: Playlist JSON at " + path + playlistExt + " is malformed.";
                                return;
                            }

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
                    $rootScope.errorMsg = error;
                    $rootScope.$broadcast('FATAL_ERROR');
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
                    $rootScope.errorMsg = 'Media for playlist did not load properly. Either the playlist is empty '
                        + 'or there was an issue getting the individual media items. Check '+  path + ' to make sure you have a valid playlist loaded.';
                    $rootScope.$broadcast('FATAL_ERROR');
                }
            }

            _i++;
        };

        service.getMediaData = function(nodeNum) {

            var current = {
                src: undefined,
                type: undefined,
                duration: 30,
                supported: true
            };

            var src, dest, filetype, filename;

            $http.get(path + mediaExt + nodeNum + '.json')

                .then(function(data) {

                    try {
                        current.type = data.data.type;
                    }
                    catch(err) {
                        $log.error("Error: JSON for node " + nodeNum + " is malformed. Processing next item. " + err);
                        $rootScope.loadingMsg = 'The JSON file at ' + path + mediaExt + nodeNum + '.json is malformed. Processing next item...';
                        $timeout(service.processPlaylist, 3000);
                        return;
                    }

                    switch (current.type) {

                        case 'visualizer_image':
                            try {
                                src = path + mediaFilesExt + data.data['field_viz_image'].und[0].uri.replace('public://', '');
                                dest = 'cache/images/' + data.data['field_viz_image'].und[0].filename;
                                current.duration = data.data['field_duration'].und[0].value ? data.data['field_duration'].und[0].value : 5;
                            }
                            catch(err) {
                                $log.error("Error: JSON for node " + nodeNum + " is malformed. Processing next item... ");
                                $rootScope.loadingMsg = 'The JSON file at ' + path + mediaExt + nodeNum + '.json is malformed. Processing next item...';
                                $timeout(service.processPlaylist, 3000);
                                return;
                            }

                            current.src = dest;

                            cacheService.getFileAndPipe(src, dest)
                                .then(
                                function(success) {
                                    $log.info(success);
                                    service.playlist.push(current);
                                    service.processPlaylist();
                                },
                                function(error) {
                                    $log.error(error);
                                    current.supported = false;
                                    $rootScope.loadingMsg = 'Image file at ' + src + ' could not be found.'
                                        +' Make sure the file is uploaded and included in the playlist properly. Processing next item...';
                                    $timeout(service.processPlaylist, 3000);
                                });
                            break;

                        case 'visualizer_video':

                            try {
                                src = path + mediaFilesExt + data.data['field_video'].und[0].uri.replace('public://', '');
                                dest = 'cache/videos/' + data.data['field_video'].und[0].filename;
                                filetype = data.data['field_video'].und[0].filemime;
                            }
                            catch(err) {
                                $log.error("Error: JSON for node " + nodeNum + " is malformed. Processing next item. ");
                                $rootScope.loadingMsg = 'The JSON file at ' + path + mediaExt + nodeNum + '.json is malformed. Processing next item...';
                                $timeout(service.processPlaylist, 3000);
                                return;
                            }

                            if (filetype == 'video/mp4') {
                                $rootScope.loadingMsg = 'The video ' + data.data['field_video'].und[0].filename
                                    + ' is an mp4 file and is not supported. Processing next item...';
                                $log.error($rootScope.loadingMsg);
                                $timeout(service.processPlaylist, 3000);
                                return;
                            }

                            current.src = dest;

                            cacheService.getFileAndPipe(src, dest)
                                .then(
                                function(success) {
                                    $log.info(success);
                                    service.playlist.push(current);
                                    service.processPlaylist();
                                },
                                function(error) {
                                    $log.error(error);
                                    current.supported = false;
                                    $rootScope.loadingMsg = 'Video file at ' + src + ' could not be found. Make sure the file is uploaded and included in the playlist properly.';
                                    $timeout(service.processPlaylist, 3000);
                                });
                            break;

                        case 'visualizer_js':

                            try {
                                src = path + mediaFilesExt + data.data['field_js_file'].und[0].uri.replace('public://', '');
                                filetype = data.data['field_js_file'].und[0].filemime;
                                filename = data.data['field_js_file'].und[0].filename;
                            }
                            catch(err) {
                                $log.error("Error: JSON for node " + nodeNum + " is malformed. Processing next item. ");
                                $rootScope.loadingMsg = 'The JSON file at ' + path + mediaExt + nodeNum + '.json is malformed. Processing next item.';
                                $timeout(service.processPlaylist, 3000);
                                return;
                            }

                            if (typeof filename !== 'string') {
                                $log.error("Error: JSON for node " + nodeNum + " is malformed. Processing next item. ");
                                $rootScope.loadingMsg = 'The JSON file at ' + path + mediaExt + nodeNum + '.json is malformed. Processing next item.';
                                $timeout(service.processPlaylist, 3000);
                                return;
                            }


                            if (filetype == 'application/x-tar'){
                                current.type = 'visualizer_pkg';

                                dest = 'cache/viz';
                                current.src = dest + '/' + filename.replace('.tar', '') + '/index.html';

                                cacheService.extractTarAndPipe(src, dest)
                                    .then(
                                    function(success) {
                                        $log.info(success);
                                        service.playlist.push(current);
                                        service.processPlaylist();
                                    },
                                    function(error) {
                                        $log.error(error);
                                        current.supported = false;

                                        if (error == 'GET_ERROR') {
                                            $rootScope.loadingMsg = 'Visualizer file at ' + src + ' could not be found. Make sure the file is uploaded and included in the playlist properly.';
                                        }
                                        else {
                                            $rootScope.loadingMsg = 'Error extracting file ' + src + '.';
                                        }

                                        $timeout(service.processPlaylist, 3000);
                                    });
                            }

                            else if (filetype == 'application/x-gtar'){
                                current.type = 'visualizer_pkg';

                                dest = 'cache/viz';
                                current.src = dest + '/' + filename.replace('.tgz', '') + '/index.html';

                                cacheService.gunzipAndExtract(src, dest)
                                    .then(
                                    function(success) {
                                        $log.info(success);
                                        service.playlist.push(current);
                                        service.processPlaylist();
                                    },
                                    function(error) {
                                        $log.error(error);
                                        current.supported = false;

                                        if (error == 'GET_ERROR') {
                                            $rootScope.loadingMsg = 'Visualizer file at ' + src + ' could not be found. Make sure the file is uploaded and included in the playlist properly.';
                                        }
                                        else {
                                            $rootScope.loadingMsg = 'Error extracting file ' + src + '.';
                                        }

                                        $timeout(service.processPlaylist, 3000);
                                    });
                            }

                            else {
                                $log.error("Error: Filetype " + filetype + " for node " + nodeNum +
                                    " is not supported. Processing next item...");
                                $rootScope.loadingMsg = 'Unsupported filetype ' + filetype
                                    + ' detected. Processing next item...';
                                $timeout(service.processPlaylist, 3000);
                                return;
                            }

                            break;

                        default:
                            current.supported = false;
                            $log.error("Unsupported type (" + current.type + ") detected in playlist.");
                            $rootScope.loadingMsg = "Unsupported type (" + current.type + ") detected in playlist."
                                + " Processing next item...";
                            $timeout(service.processPlaylist, 3000);
                            break;

                    }

                },

                function(error) {
                    $rootScope.loadingMsg = "Error getting media at " + path + mediaExt + nodeNum + '.json.' + ' Processing next item.';
                    $log.error('Error getting media information from: ' + path + mediaExt + nodeNum + '.json.' + '\nProcessing next media item.');
                    $timeout(service.processPlaylist, 3000);

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

            if(_stop) {
                $log.info("Playlist stopped");
                return;
            }

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
                    throw new Error("Malformed JSON. Unrecognized type: " + nextItem.type);

            }


        };

        service.completed = function () {

            service.next();
            service.sequence();

        };

        service.stop = function() {
            _stop = true;
        };

        service.resume = function() {
            _stop = false;
        };

        return service;


    });
