'user string';

angular.module("MHM-APP")
.controller('DetailController', function($scope, data) {
    $scope.selectedItem = data;
});