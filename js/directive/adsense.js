angular.module('InsertAdsense', [])
	.directive("adsense", function(){
		return{
			template: '<div class="row" id="adsense_wrapper"><script async src="//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script><!-- MyHistoryMap下部広告 --><ins class="adsbygoogle"     style="display:block"     data-ad-client="ca-pub-2131186805773040"     data-ad-slot="5808074819"     data-ad-format="auto"></ins><script>(adsbygoogle = window.adsbygoogle || []).push({});</script></div>'
		};
	});