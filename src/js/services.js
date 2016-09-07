'use strict';

angular.module('services', [])
.factory('API',['$http', '$q', '$window', function($http, $q, $window){
	var API_URL = "http://"+$window.location.hostname +":"+ $window.location.port;
	var service = {};
	service.getNetworks = function(){
		return $http.get(API_URL+"/networks");
	};

	service.connect = function(network, pin){
		return $http.put(API_URL+"/connect/"+network+"/"+pin);
	};
	return service;
}]);