'use strict';

angular.module('myApp', ['ngRoute', 'ngAnimate', 'ngNotify', 'controllers', 'directives', 'services'])
.config(['$routeProvider', function($routeProvider) {

	$routeProvider
	.when('/', {
		templateUrl: 'partials/connect.html',
		controller: 'ConnectCtrl',
		name: 'connect'
	})
	.otherwise({
		redirectTo: '/'
	});
	
}])
.run(['$rootScope',function($rootScope) {
  $rootScope.title = "MyAngularSeed";
}]);