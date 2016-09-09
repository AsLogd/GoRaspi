

angular.module('controllers', [])
.controller('HeaderCtrl', ['$scope', '$rootScope', function($scope, $rootScope){
	$scope.ssid = "";
	$scope.$watch('$root.serverStatus.lastAp.ssid', function() {
		if($rootScope.serverStatus && $rootScope.serverStatus.lastAp && 
			$rootScope.serverStatus.lastAp.ssid)
		{
	    	$scope.ssid = $rootScope.serverStatus.lastAp.ssid;
			
		}
	});
}])
.controller('PanelCtrl', ['$scope', 'Camera', function($scope, camera){
	$scope.camera = camera;
}])
.controller('InitCtrl', ['$scope', '$rootScope', 'serverStatus', 'Camera', '$location', 
	function($scope, $rootScope, serverStatus, Camera, $location){
		$rootScope.serverStatus = serverStatus.data;
		if(serverStatus.data.lastAp)
		{
			$rootScope.$broadcast('startLoading');
			Camera.init(true).then(function(){
				$rootScope.$broadcast('finishLoading');
				$location.path('/status');
				
			});
		}
		else
		{
			Camera.init(false);
			$location.path('/connect');
		}
}])
.controller('ConnectCtrl', ['$scope', 'API', 'ngNotify', 'Camera', '$location', '$rootScope',
	function ($scope, API, ngNotify, Camera, $location, $rootScope) {
		$scope.step = -1;
		$scope.networks = [];
		$scope.selectedNetwork = "";
		$scope.showNetworks = false;
		$scope.customPasswordUsed = false;
		$scope.password = "";

		$scope.$watch('$root.serverStatus.aps', function() {
			if($rootScope.serverStatus && $rootScope.serverStatus.aps)
			{
		    	$scope.aps = $rootScope.serverStatus.aps;
				
			}
		});

		$scope.nextStep = function(){
			//Loading?
			if($scope.step == -1)
			{
				$scope.step++;
			}
			else if($scope.step === 0)
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
			$rootScope.$broadcast('startLoading');
			API.getNetworks().then(function(response){
				$rootScope.$broadcast('finishLoading');
				console.info("Network list acquired.");
				$scope.networks = response.data;
				if(cb) cb();
			});
		};

		$scope.connect = function(){
			$rootScope.$broadcast('startLoading');
			Camera.connect($scope.selectedNetwork, $scope.pin, $scope.password).then(function(){
				$rootScope.$broadcast('finishLoading');
				console.info("Connected to "+$scope.selectedNetwork+".");
				$location.path("/status");
			}, function(){
				$rootScope.$broadcast('finishLoading');

				ngNotify.set("No se ha podido conectar con la cámara. Comprueba que la red existe y prueba otra vez.", "error");
			});
		};

		$scope.connectExistingAp = function(ap){
			$rootScope.$broadcast('startLoading');
			Camera.connectExisting(ap).then(function(){
				$rootScope.$broadcast('finishLoading');
				console.info("Connected to "+ap.ssid+".");
				$location.path("/status");
			}, function(){
				$rootScope.$broadcast('finishLoading');

				ngNotify.set("No se ha podido conectar con la cámara. Comprueba que la red existe y prueba otra vez.", "error");
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
}])
.controller('TasksCtrl',['$scope', '$rootScope', 'API',
	function($scope, $rootScope, API){
	$scope.anyTaskSelected = false;
	$scope.creatingTask = false;
	$scope.t = {};
	$scope.t.dayList = [];
	$scope.$watch('$root.serverStatus.aps', function() {
		if($rootScope.serverStatus && $rootScope.serverStatus.tasks)
		{
	    	$scope.tasks = $rootScope.serverStatus.tasks;
			
		}
		else
		{
			$scope.tasks = [];
		}
	});

	function unselectTasks()
	{
		$scope.tasks.forEach(function(element){
			element.selected = false;
		});
	}

	$scope.getNumber = function(num){
		return new Array(num);
	};

	$scope.deleteTask = function(task){
		if(task)
		{
			$rootScope.$broadcast('startLoading');
			API.deleteTask(task).then(function(){
				console.log("Task deleted");
				API.getServerStatus().then(function(response){
					$rootScope.$broadcast('finishLoading');
					console.log(response);
					$rootScope.serverStatus = response.data;
				});	
			});
		}
	};

	$scope.selectTask = function(task){
		unselectTasks();
		task.selected = true;
		$scope.anyTaskSelected = true;
		$scope.selectedTask = task;
	};

	$scope.newTask = function(){
		$scope.creatingTask = true;
	};

	$scope.createTask = function(task){
		var negateHours = false;
		var hours = [];
		for(var i = 0; i < 23; i++)
		{
			hours.push(false);
		}
		task.from = parseInt(task.from);
		task.to = parseInt(task.to);
		if(task.from > task.to)
		{
			negateHours = true;
			var aux = task.to;
			task.to = task.from;
			task.from = aux;
		}
		for(i = task.from-1; i < task.to; i++)
		{
			hours[i] = true;
		}

		var cron = "*/"+task.minutes+" ";

		for(i = 0; i < hours.length; i++)
		{
			if(negateHours)
			{
				hours[i] = !hours[i];
			}
			if(hours[i])
			{
				cron += (i+1)+",";
			}
		}

		cron = cron.slice(0,cron.length-1);

		cron += " * * " + task.dayList.sort().toString();
		
		task.cron = cron;

		$rootScope.$broadcast('startLoading');
		API.createTask(task).then(function(){
			console.info("Task created");
			$scope.creatingTask = false;
			API.getServerStatus().then(function(response){
				$rootScope.$broadcast('finishLoading');
				console.log(response);
				$rootScope.serverStatus = response.data;
			});
		});
		

	};

	$scope.selectDay = function(num){
		if($scope.daySelected(num))
		{
			$scope.t.dayList.splice($scope.t.dayList.indexOf(num), 1);
		}
		else
		{
			$scope.t.dayList.push(num);
		}
	};

	$scope.daySelected = function(num){
		return $scope.t.dayList.indexOf(num) != -1;
	};

}]);