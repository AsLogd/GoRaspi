'use strict';

angular.module('myApp', ['ngRoute', 'ngAnimate', 'ngNotify', 'controllers', 'directives', 'services'])
.config(['$routeProvider', function($routeProvider) {

	$routeProvider
	.when('/', {
		templateUrl: 'partials/first.html',
		controller: 'FirstCtrl',
		name: 'index',
		resolve: {
			dependency:['$route', '$window', 'FirstService', function($route, window, FirstService)
			{
				var obj = FirstService.mockData();
				window.console.log("Resolved:"+obj.title);
				return obj;
			}]
		},
		animations:{
			//page_name: ['animation_in', 'animation_out']
			route2: ['slidedown','slideup'],
			route1: ['slidedown','slideup']
		}
	})
	.when('/route1', {
		templateUrl: 'partials/first.html',
		controller: 'FirstCtrl',
		name: 'route1',
		resolve: {
			dependency:['$route', '$window', 'FirstService', function($route, window, FirstService)
			{
				var obj = FirstService.mockData();
				window.console.log("Resolved:"+obj.title);
				return obj;
			}]
		},
		animations:{
			route2: ['slidedown','slideup'],
			index: ['slidedown','slideup']
		}
	})
	.when('/route2', {
		templateUrl: 'partials/first.html',
		name:'route2',
		controller: 'FirstCtrl',
		resolve: {
			dependency:['$route', '$window', 'FirstService', function($route, window, FirstService)
			{
				var obj = FirstService.mockData();
				window.console.log("Resolved:"+obj.title);
				return obj;
			}]
		},
		animations:{
			index: ['slidedown','slideup'],
			route1: ['slidedown','slideup']
		}
	})
	.otherwise({
		redirectTo: '/'
	});
	
}])
.run(['$rootScope',function($rootScope) {
  $rootScope.title = "MyAngularSeed";
}]);