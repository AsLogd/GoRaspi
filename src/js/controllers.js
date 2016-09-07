

angular.module('controllers', [])

.controller('FirstCtrl', ['$scope', 'dependency', 'FirstService',
	function ($scope, dependency, FirstService) {
		$scope.appTitle = dependency.title;
		$scope.appVersion = dependency.ver;

}]);