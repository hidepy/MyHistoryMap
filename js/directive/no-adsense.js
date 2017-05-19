(function(){
    'use strict';

	angular.module('MHM-APP')
        .directive("adsense", function(){
            return {
                restrict: "E",
                template: 'YOU ARE ADMIN!!',
                compile: function(el, attr){
                    
                }
            }
        });
})();