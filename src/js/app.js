'use strict';

angular.module('myApp', ['ngRoute', 'ngAnimate', 'ngNotify', 'controllers', 'directives', 'services'])
.config(['$routeProvider', function($routeProvider) {

	$routeProvider
	.when('/', {
		controller:'InitCtrl',
		name: 'init',
		resolve:{
			'serverStatus':['API', function(API){
				return API.init();
			}]
		},
		template: " "
	})
	.when('/connect', {
		templateUrl: 'partials/connect.html',
		controller: 'ConnectCtrl',
		name: 'connect'
	})
	.when('/status', {
		templateUrl: 'partials/status.html',
		controller: 'StatusCtrl',
		name: 'status'
	})
	.when('/tasks', {
		templateUrl: 'partials/tasks.html',
		controller: 'TasksCtrl',
		name: 'tasks'
	})
	.otherwise({
		redirectTo: '/'
	});
	
}])
.run(['$rootScope', '$location', function($rootScope, $location) {
  $rootScope.title = "Intervalómetro";
  $location.path('/');

}]);