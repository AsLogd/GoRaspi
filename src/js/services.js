'use strict';

angular.module('services', [])
.factory('API',['$http', '$q', function($http, $q){
	var API_URL = "http://localhost:3000";
	var service = {};
	service.getNetworks = function(){
		return $http.get(API_URL+"/networks");
	};

	service.connect = function(network, pin){
		return $http.put(API_URL+"/connect/"+network+"/"+pin);
	};
	return service;
}]);