(function(){
    'use strict';

	angular.module('MHM-APP')
        .directive("adsense", function(){
            return {
                restrict: "E",
                template: '<script async src="//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>  <!-- MHM-詳細側下部広告 -->  <ins class="adsbygoogle"       style="display:block"       data-ad-client="ca-pub-2131186805773040"       data-ad-slot="6569687211"       data-ad-format="auto"></ins>  <script>  (adsbygoogle = window.adsbygoogle || []).push({});  </script>',
                compile: function(el, attr){
                    
                }
            }
        });
})();