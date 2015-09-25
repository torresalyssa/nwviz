/**
 * Created by mkahn on 4/28/15.
 *
 * Rewritten by Mitch on 9/24/2015 as a "Lite" version using proper Angular promises convention.
 *
 */


angular.module('ngActiv8orLite', [])
    .factory('actv8API', function ($http, $rootScope, $log) {

        var service = {};
        var _apiToken;

        //Do this so it is not hard coded (except port).
        var _siteOrigin = window.document.location.protocol + "//" + window.document.location.hostname + ':1337';

        service.authorized = false;
        service.bypassAuth = false; //for testing

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
            //$rootScope.$broadcast('NOT-AUTHORIZED');
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

        /* New version using modern promises $http */
        service.authorize = function (user, pass) {

            $log.info("ngActv8API: authorize called");

            return $http.post(_siteOrigin + '/auth/local', {identifier: user, password: pass})
                .then( function(data){
                    $log.info("ngActv8API: authorized OK");
                    service.authorized = true;
                    _apiToken = data.data.token;
                    localStorage.setItem("token", _apiToken);
                    $http.defaults.headers.common["Authorization"] = "JWT " + _apiToken;
                    $rootScope.$broadcast('AUTHORIZED');
                    return data; // though probably not used
                })
                .catch ( function(err){
                    $log.warn("ngActv8API: authorize failure");
                    $rootScope.$broadcast('NOT-AUTHORIZED');
                    throw err;
                });

        }


        service.getResource = function (resourceName, queryString) {

            var endpoint = _siteOrigin + "/" + resourceName;
            if (queryString)
                endpoint = endpoint + '?' + queryString;

            return $http.get(endpoint);

        }

        service.deleteResource = function (resourceName, id) {

            var endpoint = _siteOrigin + "/" + resourceName + "/" + id;
            return $http.delete(endpoint);

        }

        //convenience methods for scrapers

        service.getInstagramMedia = function(){
            return service.getResource('media', 'source=instagram');
        };

        service.getTweets = function(){
            return service.getResource('media', 'source=twitter');
        };

        service.flagMedia = function(id, definedFlags){
            return $http.put(_siteOrigin + "/media/"+id, {flags: definedFlags});
        };

        service.stickyMedia = function(id, definedFlags){
            return $http.put(_siteOrigin + "/media/"+id, {flags: definedFlags});
        };

        service.favoriteMedia = function(id, definedFlags){
            return $http.put(_siteOrigin + "/media/"+id, {flags: definedFlags});
        };

        return service;


    });

