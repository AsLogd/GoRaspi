'use strict';

angular.module('myApp', ['ngRoute', 'ngAnimate', 'ngNotify', 'controllers', 'directives', 'services'])
.config(['$routeProvider', function($routeProvider) {

	$routeProvider
	.when('/', {
		controller:'InitCtrl',
		name: 'init',
		resolve:{
			'serverStatus':['API', function(API){
				return API.getServerStatus();
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
	.otherwise({
		redirectTo: '/'
	});
	
}])
.run(['$rootScope', '$location', function($rootScope, $location) {
  $rootScope.title = "MyAngularSeed";
  $location.path('/');

}]);