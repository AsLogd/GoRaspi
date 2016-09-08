

angular.module('controllers', [])

.controller('ConnectCtrl', ['$scope', 'API', 'ngNotify', '$location',
	function ($scope, API, ngNotify, $location) {
		$scope.step = 0;
		$scope.networks = [];
		$scope.selectedNetwork = "";
		$scope.showNetworks = false;

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
			API.connect($scope.selectedNetwork, $scope.pin).then(function(){
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
.controller('StatusCtrl', ['status', 
	function(status){
		$scope.status = status;
		$scope.parseBatteryLevel = function(level){
			if(level == 1)
				return "Baja";
			if(level == 2)
				return "Media";
			if(level == 3)
				return "Alta";
			if(level == 4)
				return "Cargando";
		};
}]);