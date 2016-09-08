

angular.module('controllers', [])

.controller('ConnectCtrl', ['$scope', 'API', 'ngNotify',
	function ($scope, API, ngNotify) {
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
			});
		};

		$scope.goProNetworks = function(item){
			if(!$scope.showNetworks) 
				return item.ssid.indexOf("GP") !== -1;
			else
				return true;
		};

}]);