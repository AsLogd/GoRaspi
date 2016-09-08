//'use strict';

angular.module('directives', [])
.directive('checkRouteError',['$location', 'ngNotify', function($location, ngNotify){
	return {
		restrict: 'A',
		link: function(scope, elem, attrs){
			scope.$on('$routeChangeError', function(){
				ngNotify.set('Error 404: No hemos encontrado la página que buscabas', 'error');
				$location.path("/");
			});
		}
	};

}])
/*
//Sets class .active; attr: querySelector
.directive('toggleElement',[function(){
	return {
		restrict: 'A',
		link: function(scope, elem, attrs){
			elem.bind('click', function(){
				var query = attrs.toggleElement;
				var target;
				if(query == "this")
					target = elem;
				else
					target = angular.element( document.querySelector(query) );

				target.toggleClass("active");
			});
		}
	};
}])
*/
.directive('loading', ['$window', function(window){
	return {
		restrict: 'E',
		template: '<div class="loading">' +
					'<img src="img/loading.gif" />'+
					'</div>',
		link: function(scope, elem, attrs){
			elem.addClass('ng-hide');

			scope.$on('$routeChangeStart', function(){
				elem.removeClass('ng-hide');
			});

			scope.$on('$routeChangeSuccess', function(){
				elem.addClass('ng-hide');
			});

			scope.$on('startLoading', function(){
				elem.removeClass('ng-hide');
			});

			scope.$on('finishLoading', function(){
				elem.addClass('ng-hide');
			});
		}
	};
}])
.directive('linkRoute',['$location', function($location){
	return {
		restrict: 'A',
		link: function(scope, elem, attrs){
			scope.$on('$routeChangeSuccess', function(){
				if($location.path() == attrs.linkRoute)
					elem.addClass('active');
				else
					elem.removeClass('active');
			});

			elem.bind('click', function(){
				if(elem.hasClass("enabled"))
				{
					$location.path( attrs.linkRoute );
					scope.$apply();
					
				}
			});
		}
	};

}]);