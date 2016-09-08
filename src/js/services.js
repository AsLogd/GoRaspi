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

	service.getStatus = function(){
		return $http.get(API_URL+"/cameraStatus");
	};
	return service;
}])
.factory('Camera', ['API', '$q', function(API, $q){
	var service = {};

	var _camera = {};

	service.isConnected = function(){
		return _camera.connected;
	};

	service.connect = function(network, pin){
		if(service.isConnected()) return;

		var deferred = $q.defer();
		API.connect(network, pin).then(function(response){
			_camera.status = response.data.status;
			_camera.connected = true;
			deferred.resolve();
		});

		return deferred.promise;
	};

	service.updateStatus = function(){
		if(!service.isConnected()) return;

		var deferred = $q.defer();
		API.getStatus().then(function(response){
			_camera.status = response.data.status;
			deferred.resolve();
		});

		return deferred.promise;	
	};

	service.getStatus = function(){
		return _camera.status;
	};

	return service;
}]);