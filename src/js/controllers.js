

angular.module('controllers', [])
.controller('PanelCtrl', ['$scope', 'Camera', function($scope, camera){
	$scope.camera = camera;
}])
.controller('ConnectCtrl', ['$scope', 'API', 'ngNotify', 'Camera', '$location',
	function ($scope, API, ngNotify, Camera, $location) {
		$scope.step = 0;
		$scope.networks = [];
		$scope.selectedNetwork = "";
		$scope.showNetworks = false;

		if(Camera.isConnected())
			$location.path('/status');

		$scope.nextStep = function(){
			//Loading?
			if($scope.step === 0)
			{
				
				$scope.updateNetworkList(function(){ 
					$scope.step++;
				});
					
			}
			else if($scope.step === 1)
			{
				if($scope.selectedNetwork === "")
				{
					ngNotify.set('Por favor, selecciona una red','error');
				}
				else
				{
					$scope.step++;
				}
			}
			else
			{
				console.error("Wrong step flow");
			}
		};

		$scope.updateNetworkList = function(cb){
			API.getNetworks().then(function(response){
				console.info("Network list acquired.");
				$scope.networks = response.data;
				if(cb) cb();
			});
		};

		$scope.connect = function(){
			Camera.connect($scope.selectedNetwork, $scope.pin).then(function(){
				console.info("Connected to "+$scope.selectedNetwork+".");
				$location.path("/status");
			});
		};

		$scope.goProNetworks = function(item){
			if(!$scope.showNetworks) 
				return item.ssid.indexOf("GP") !== -1;
			else
				return true;
		};

}])
.controller('StatusCtrl', [ '$scope', 'Camera','$location', 
	function($scope, Camera, $location){
		if(Camera.isConnected())
		{

			$scope.status = Camera.getStatus();
			$scope.batteryLevel = (function(level){
				if(level == 1)
					return "Baja";
				if(level == 2)
					return "Media";
				if(level == 3)
					return "Alta";
				if(level == 4)
					return "Cargando";
			})($scope.status.battery.level);
			
		}
		else
		{
			$location.path('/connect');
		}
}]);