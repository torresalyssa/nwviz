/**
 * Created by mkahn on 8/21/15.
 */

app.factory('playlistService',
    function ($rootScope, $location, $timeout, $log, $http, cacheService) {
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

        function setNewTokenFromLogin(res) {

            $http.defaults.headers.common["X-CSRF-Token"] = res.data.token;

        }


        service.login = function() {
            var p = path+ 'api/v1/'+  loginExt;
            return getToken()
                .then(function() {
                    superagent
                        .post(p)
                        .send({username: 'stubber_viz', password: 'v1zu@l'})
                        .set('X-CSRF-Token', $http.defaults.headers.common["X-CSRF-Token"])
                        .set('Accept', 'application/json')
                        .end(function (err, res) {
                            if(err) {
                                throw new Error("Superagent login error");
                            } else {
                                return res;
                            }
                        })
                })
        };

        service.getMediaData = function(nodeNum) {

            $rootScope.loadingMsg = "Loading media";

            var current = {
                src: undefined,
                type: undefined,
                duration: undefined,
                supported: true
            };

            var src, dest;

            $http.get(path + mediaExt + nodeNum + '.json')

                .then(function(data) {

                    current.type = data.data.type;

                    switch (current.type) {

                        case 'visualizer_image':
                            src = path + mediaFilesExt + data.data['field_viz_image'].und[0].uri.replace('public://', '');
                            dest = 'cache/images/' + data.data['field_viz_image'].und[0].filename;

                            current.src = dest;
                            current.duration = data.data['field_duration'].und[0].value;

                            cacheService.getFileAndPipe(src, dest, service.processPlaylist);
                            break;

                        case 'visualizer_video':
                            src = path + mediaFilesExt + data.data['field_video'].und[0].uri.replace('public://', '');
                            dest = 'cache/videos/' + data.data['field_video'].und[0].filename;

                            current.src = dest;

                            cacheService.getFileAndPipe(src, dest, service.processPlaylist);
                            break;

                        case 'visualizer_js':
                            src = path + mediaFilesExt + data.data['field_js_file'].und[0].uri.replace('public://', '');

                            if (data.data['field_js_file'].und[0].filemime == 'application/zip') {
                                current.type = 'visualizer_pkg';

                                dest = 'cache/viz';
                                current.src = dest + '/' + data.data['field_js_file'].und[0].filename.replace('.zip', '') + '/index.html';

                                $rootScope.loadingMsg = "Unzipping media";

                                cacheService.unzipAndPipe(src, dest, service.processPlaylist);
                            }

                            else if (data.data['field_js_file'].und[0].filemime == 'application/tar'){
                                current.type = 'visualizer_pkg';

                                dest = 'cache/viz';
                                current.src = dest + '/' + data.data['field_js_file'].und[0].filename.replace('.tar', '') + '/index.html';

                                $rootScope.loadingMsg = "Extracting tarball";

                                cacheService.extractTarAndPipe(src, dest, service.processPlaylist);
                            }

                            else if (data.data['field_js_file'].und[0].filemime == 'application/tgz'){
                                current.type = 'visualizer_pkg';

                                dest = 'cache/viz';
                                current.src = dest + '/' + data.data['field_js_file'].und[0].filename.replace('.tgz', '') + '/index.html';

                                $rootScope.loadingMsg = "Extracting tarball";

                                cacheService.gunzipAndExtract(src, dest, service.processPlaylist);
                            }

                            else if (data.data['field_js_file'].und[0].filemime == 'application/js'){
                                dest = 'cache/js/' + data.data['field_js_file'].und[0].filename.replace('.txt', '');
                                current.src = dest;

                                cacheService.getFileAndPipe(src, dest, service.processPlaylist);
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
                })
        };

        service.processPlaylist = function() {

            var i = _i;

            if (i < _nodes.length) {
                service.getMediaData(parseInt(_nodes[i]));
            }

            if (i == _nodes.length) {
                service.playlistValid = true;

                $rootScope.loadingMsg = '';

                _index = 0;
                $log.info("Playlist loaded ok: " + path + playlistExt);
                $rootScope.$broadcast('PLAYLIST_LOADED');
            }

            _i++;
        };

        service.init = function (endpoint) {
            var nodes, tmp;
            path = endpoint;

            $rootScope.loadingMsg = "Logging in";
            $timeout(function () {
                $location.path('loading')
            });

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
                        })

                        .catch(function () {
                            $log.error("Could not load playlist");
                            $rootScope.$broadcast('BAD_PLAYLIST');

                        })
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
