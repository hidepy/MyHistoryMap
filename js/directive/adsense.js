(function(){
    'use strict';

	angular.module('MHM-APP')
        .directive("adsense", function(){
            return {
                restrict: "E",
                template: '<script async src="//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>    <ins class="adsbygoogle"         style="display:block"         data-ad-format="autorelaxed"         data-ad-client="ca-pub-2131186805773040"         data-ad-slot="2021420810"></ins>    <script>         (adsbygoogle = window.adsbygoogle || []).push({});    </script>',
                compile: function(el, attr){
                    
                }
            }
        });
})();