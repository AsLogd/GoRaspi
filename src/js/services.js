'use strict';

angular.module('services', [])
.factory('FirstService',['$http', '$q', function($http, $q){
	var service = {};
	service.mockData = function(){
		return {title: "My angular seed", ver: "0.1a"};
	};
	return service;
}]);