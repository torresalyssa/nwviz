/**
 * Created by mkahn on 4/28/15.
 */

/**
 *
 *
 */

angular.module('ngActiv8', [])
    .factory('actv8API', function ($http, $q, $rootScope, $log) {

        var service = {};
        var _apiToken;

        //Do this so it is not hard coded (except port).
        var _siteOrigin = window.document.location.protocol + "//" + window.document.location.hostname + ':1337';

        service.authorized = false;
        service.bypassAuth = false; //for testing

        //TODO: Ethan, replace any direct refs of the above vars in other modules with calls to this method, then
        //make the above vars private
        service.isAuthorized = function () {

            return ( service.authorized || service.bypassAuth );

        }

        /**
         * Change site origin from the default. Also resets the auth status.
         * @param origin
         */
        service.setSiteOrigin = function (origin) {
            _siteOrigin = origin;
            service.logout();
        }

        /**
         * Return site origin
         * @returns {string}
         */
        service.getSiteOrigin = function () {

            return _siteOrigin;

        }


        /**
         * Effectively logs out by deleting the local token.
         *
         */
            //TODO implement a logout on the server side?
        service.logout = function () {
            service.authorized = false;
            localStorage.removeItem("token");
            $rootScope.$broadcast('NOT-AUTHORIZED');
        }


        /**
         * Common error handler for errors communicating with A8
         * @param data
         * @param status
         * @param promise
         */
        function handleRESTError(data, status, promise) {

            $log.warn("ngActv8API: Handling REST error with status: " + status);

            var a8Error = new A8ErrorObject();

            a8Error
                .setStatus(status)
                .setErrObject(data);

            if (data !== null) {
                a8Error.setType(data.error || 'net');
            }

            switch (status) {
                case 400:
                    //Usually malformed data
                    switch (a8Error.type) {
                        case 'E_VALIDATION':
                            //A number of things could be wrong here, but the most common is either duplicated email
                            //or invalid email format.
                            for (var property in data.invalidAttributes) {
                                if (data.invalidAttributes.hasOwnProperty(property)) {
                                    a8Error.setMessage(data.model + ': ' + property + ' violated rule: ' + data.invalidAttributes[property][0].rule);
                                }
                            }

                            break;

                        default:
                            a8Error.setMessage('Unusual error of type: ' + a8Error.type); // kind of redundant

                    }
                    break;

                case 401:
                    $log.warn("Unauthorized, removing local auth info.");
                    a8Error.setMessage("Unauthorized for that operation.");
                    service.logout();
                    break;
            }

            promise.reject(a8Error);

        }


        // For POST, PATCH and PUT. Operations with a body
        function doHttpPxxOp(endpoint, verb, node) {

            var deferred = $q.defer();

            $http({method: verb.toUpperCase(), url: endpoint, data: node}).
                success(function (data, status, headers, config) {
                    deferred.resolve({data: data, status: status});
                }).
                error(function (data, status, headers, config) {
                    handleRESTError(data, status, deferred);
                });

            return deferred.promise;

        }

        // No filter or sort yet
        function doHttpGetOp(endpoint) {

            var deferred = $q.defer();

            $http({method: 'GET', url: endpoint}).
                success(function (data, status, headers, config) {
                    deferred.resolve({data: data, status: status});
                }).
                error(function (data, status, headers, config) {
                    handleRESTError(data, status, deferred);
                });

            return deferred.promise;

        }

        function doHttpDeleteOp(endpoint) {

            var deferred = $q.defer();

            $http({method: 'DELETE', url: endpoint}).
                success(function (data, status, headers, config) {
                    deferred.resolve({data: data, status: status})
                }).
                error(function (data, status, headers, config) {
                    handleRESTError(data, status, deferred);
                });

            return deferred.promise;
        }

        service.checkAuthorization = function () {

            _apiToken = localStorage.getItem("token");
            if (_apiToken) {
                service.authorized = true; // All though the token may be expired!
                $http.defaults.headers.common["Authorization"] = "JWT " + _apiToken;
                $rootScope.$broadcast('AUTHORIZED');

            } else {
                service.authorized = false;
                $rootScope.$broadcast('NOT-AUTHORIZED');
            }
        }

        service.authorize = function (user, pass) {

            $log.info("ngActv8API: authorize called");
            var deferred = $q.defer();

            $http.post(_siteOrigin + '/auth/local', {identifier: user, password: pass}).
                success(function (data, status, headers, config) {
                    $log.info("ngActv8API: authorized OK");
                    service.authorized = true;
                    _apiToken = data.token;
                    localStorage.setItem("token", _apiToken);
                    $http.defaults.headers.common["Authorization"] = "JWT " + _apiToken;
                    $rootScope.$broadcast('AUTHORIZED');
                    deferred.resolve({data: data, status: status});
                }).
                error(function (data, status, headers, config) {
                    $log.warn(data);
                    $log.warn("ngActv8API: authorize failure");
                    //handleRESTError(data, status, deferred);
                    $rootScope.$broadcast('NOT-AUTHORIZED');

                });


            return deferred.promise;

        }


        service.getResource = function (resourceName, queryString) {

            var endpoint = _siteOrigin + "/" + resourceName;
            if (queryString)
                endpoint = endpoint + '?' + queryString;

            return doHttpGetOp(endpoint);

        }

        service.deleteResource = function (resourceName, id) {

            var endpoint = _siteOrigin + "/" + resourceName + "/" + id;
            return doHttpDeleteOp(endpoint);

        }


        // CONVENIENCE METHODS for GUESTS

        service.registerGuest = function (guestData) {

            var endpoint = _siteOrigin + "/guest";
            return doHttpPxxOp(endpoint, "POST", guestData);

        }

        service.getSimulatedGuests = function () {
            var endpoint = _siteOrigin + "/guest";
            var node = '?where={"data: {simulated:"true"}}';
            return doHttpPxxOp(endpoint, "GET", node);
        }

        service.getSimulatedExperiences = function () {
            var endpoint = _siteOrigin + "/experience";
            var node = '?where={"data: {simulated:"true"}}';
            return doHttpPxxOp(endpoint, "GET", node);
        }

        service.getSimulatedQueues = function(){
            var endpoint = _siteOrigin + "/queue";
            var node = '?where={"data: {simulated:"true"}}';
            return doHttpPxxOp(endpoint, "GET", node);
        }

        // CONVENIENCE METHODS for EXPERIENCES

        //TODO document the fields because I cannot remember how it works!
        /**
         *
         * @param experienceObj
         * @returns {*}
         */
        service.addExperience = function (experienceObj) {

            var endpoint = _siteOrigin + "/experience";

            var expData = {};

            if (experienceObj.media !== undefined) {
                var mediaArray;
                if(typeof(experienceObj) == 'string') {
                    mediaArray = experienceObj.media.split(",");
                }
                else{
                    mediaArray = experienceObj.media;
                }
                expData['media'] = mediaArray;
            }

            if (experienceObj.guest !== undefined) {
                expData['guest'] = experienceObj.guest;
            }

            if (experienceObj.readyForUpload !== undefined) {
                expData['readyForUpload'] = experienceObj.readyForUpload;
            }

            if (experienceObj.data !== undefined) {
                expData['data'] = experienceObj.data;
            }

            if(experienceObj.experienceName !== undefined) {
                expData['experienceName'] = experienceObj.experienceName;
                //alert("ASD")
            }
            console.info(expData);

            return doHttpPxxOp(endpoint, "POST", expData);

        };

        /**
         * Get the count of a number of objects
         * @param objectType
         * @returns {deferred.promise|*}
         */
        service.getCount = function (objectType) {

            var deferred = $q.defer();

            $http.get(_siteOrigin + "/" + objectType)
                .success(function (data) {
                    deferred.resolve(data.length);
                })
                .error(function (data, status, headers, config) {
                    handleRESTError(data, status, deferred);
                });

            return deferred.promise;

        }

        /**
         * Upload a media file
         * @param file
         * @returns {deferred.promise|*}
         */

         //TODO I think Scott created a new Media upload endpoint...
        service.uploadMedia = function (file, experienceId) {
            var deferred = $q.defer();

            var fd = new FormData();
            fd.append('file', file);

            if (experienceId){
                fd.append('experienceId', experienceId);
            }

            //fd.append('id', guestId);
            // Content-Type undefined supposedly required here, transformed elsewhere
            $http.post(_siteOrigin + '/media/upload', fd, {
                transformRequest: angular.identity,
                headers: {'Content-Type': undefined}
            })
                .success(function (data) {
                    console.log("Successfully uploaded to Media!");
                    deferred.resolve(data);
                })
                .error(function (data, status) {
                    console.log("FAIL uploading to Media!");
                    deferred.reject(data);

                });

            return deferred.promise;
        }

        //convenience methods for queue

        service.addQueueEntry = function (queueEntryData) {

            var endpoint = _siteOrigin + "/queue";
            return doHttpPxxOp(endpoint, "POST", queueEntryData);
        };

        service.completeQueueEntry = function(guestId, options){
            if(guestId != undefined && options != undefined){
                options.completed = Date.now();
                var endpoint = _siteOrigin + '/queue/' + guestId;
                return doHttpPxxOp(endpoint, "PUT", options);
            }
            return new Error("need additional info");
        };

        service.popFromQueueNamed = function(queueName){
            var endpoint = _siteOrigin + "/queue/pop?queueName=" + queueName;
            return doHttpGetOp(endpoint);
        };

        //convenience methods for watchdog

        service.addWatchdog = function(watchdogData){
            var endpoint = _siteOrigin + "/watchdog";
            if(watchdogData.contactsArr){
                watchdogData.contacts = JSON.stringify(watchdogData.contactsArr);
            }
            return doHttpPxxOp(endpoint, "POST", watchdogData);
        };

        service.pingWatchdog = function(watchdogData){
            var endpoint = _siteOrigin + "/watchdog/ping";
            console.log("HERE");
            return doHttpPxxOp(endpoint, "POST", watchdogData);
        };

        service.changeWatchDogEntry = function(dogId, options){
            if(dogId != undefined && options != undefined){
                options = {contacts :options.contacts, alarmInterval: options.alarmInterval};
                var endpoint = _siteOrigin + '/watchdog/' + dogId;
                return doHttpPxxOp(endpoint, "PUT", options);
            }
            return new Error("need additional info");
        };

        service.addUser = function (userData) {

            var endpoint = _siteOrigin + "/user";
            return doHttpPxxOp(endpoint, "POST", userData);
        };

        //convenience methods for users

        //convenience methods for report recipients

        service.updateSettings = function(id, options){
            var endpoint = _siteOrigin + "/settings/" + id;
            return doHttpPxxOp(endpoint, "PUT", options);
        };

        service.getNotificationSettings = function(){
            var stuff = {};

            var resource = "settings";

            var promise1 = service.getResource(resource, "key=twilioSettings");
            var promise2 = service.getResource(resource, "key=sendgridSettings");

            return $q.all([promise1, promise2]);
        };

        //convenience methods for scrapers

        service.getInstagramMedia = function(){
            return service.getResource('media', 'source=instagram');
        };

        service.getTweets = function(){
            return service.getResource('media', 'source=twitter');
        };

        service.flagMedia = function(id, definedFlags){
            return doHttpPxxOp(_siteOrigin + "/media/"+id, 'PUT',{flags: definedFlags});
        };

        service.stickyMedia = function(id, definedFlags){
            return doHttpPxxOp(_siteOrigin + "/media/"+id, 'PUT',{flags: definedFlags});
        };

        service.favoriteMedia = function(id, definedFlags){
            return doHttpPxxOp(_siteOrigin + "/media/"+id, 'PUT',{flags: definedFlags});
        };

        return service;


    });

