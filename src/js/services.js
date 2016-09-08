'use strict';

angular.module('services', [])
.factory('API',['$http', '$q', '$window', function($http, $q, $window){
	var API_URL = "http://"+$window.location.hostname +":"+ $window.location.port;
	var service = {};
	service.getNetworks = function(){
		return $http.get(API_URL+"/networks");
	};

	service.connect = function(network, pin, password){
		pin = pin ? pin : "undefined";
		password = password ? password : "undefined";
		return $http.put(API_URL+"/connect/"+network+"/"+pin+"/"+password);
	};

	service.getStatus = function(){
		return $http.get(API_URL+"/cameraStatus");
	};

	service.getServerStatus = function(){
		return $http.get(API_URL+"/init");
	};

	return service;
}])
.factory('Camera', ['API', '$q', function(API, $q){
	var service = {};

	var _camera = {};

	service.init = function(connected){
		var deferred = $q.defer();
		_camera.connected = connected;
		if(connected)
		{
			service.updateStatus().then(function(){
				deferred.resolve();
			});
		}

		return deferred.promise;
	};

	service.isConnected = function(){
		return _camera.connected;
	};


	service.connect = function(network, pin, password){
		if(service.isConnected()) return;

		var deferred = $q.defer();
		API.connect(network, pin, password).then(function(response){
			_camera.status = response.data;
			_camera.connected = true;
			deferred.resolve();
		});

		return deferred.promise;
	};

	service.updateStatus = function(){
		if(!service.isConnected()) return;

		var deferred = $q.defer();
		API.getStatus().then(function(response){
			_camera.status = response.data;
			deferred.resolve();
		});

		return deferred.promise;	
	};

	service.getStatus = function(){
		return _camera.status;
	};

	return service;
}]);