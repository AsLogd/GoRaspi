'use strict';

angular.module('myApp', ['ngRoute', 'ngAnimate', 'ngNotify', 'controllers', 'directives', 'services'])
.config(['$routeProvider', function($routeProvider) {

	$routeProvider
	.when('/connect', {
		templateUrl: 'partials/connect.html',
		controller: 'ConnectCtrl',
		name: 'connect'
	})
	.otherwise({
		redirectTo: '/connect'
	});
	
}])
.run(['$rootScope',function($rootScope) {
  $rootScope.title = "MyAngularSeed";
}]);