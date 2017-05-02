(function(){
    'use strict';

    // load event
    // normal javascript
    document.addEventListener("DOMContentLoaded", function(){
        // 本来は、angularの世界なんでservice化すべきとも思うが...angular以外でも使い回ししたいんで
        window.StorageManager_Fav = new StorageManager("MHM-Favorite");

        window.CommonFunctions = {
            formatDate: function(date){
                return ("" + date.getFullYear() + ("00" + (date.getMonth() + 1)).slice(-2) + ("00" + date.getDate()).slice(-2) + ("00" + date.getHours()).slice(-2) + ("00" + date.getMinutes()).slice(-2) + ("00" + date.getSeconds()).slice(-2) );
            }
        };

        var TABCONTENT_HEIGHT = window.innerHeight * (45.0 / 100.0);
        document.getElementById("history_map").style.height   = TABCONTENT_HEIGHT;
        document.getElementById("cards_wrapper").style.height = TABCONTENT_HEIGHT;
        document.getElementById("cards_wrapper").style.maxHeight = TABCONTENT_HEIGHT;
        document.getElementById("cards_wrapper").style.overflow = "scroll";
    });

    // angular module setup
    angular.module('MHM-APP', ['slickCarousel', 'ngRoute', 'MapHandlerService'])
        .config(function($routeProvider){
            $routeProvider
                .when("/", {
                    templateUrl: "view/main.html",
                    controller: "HeaderController"
                })
                .when("/:pref", {
                    templateUrl: "view/main.html",
                    controller: "HeaderController"
                })
                .when("/detail/:id", {
                    templateUrl: "view/detail.html",
                    controller: "DetailController",
                    resolve: {
                        GetDetailData: function(GetCurrentSelectData){
                            return GetCurrentSelectData.getData();
                        }
                    }
                })
                .otherwise({
                    redirectTo: "/"
                });
        })
        .service("GetCurrentSelectData", function(){
            this.getData = function(){
                return {id: "mytestid", name: "nothing...name"};
            };
        })
        .service("MapPointDataAdapter", function($http){
            this.getData = function(param){
                var query_string = "&needonlydata=true";
                for(var p in param){
                    query_string += "&" + p + "=" + param[p];
                }
                return $http.jsonp("index.php" + "?" + "callback=JSON_CALLBACK" + query_string)
                    // 戻りはpromiseオブジェクトなんで
                    .then(function(response_wrapper){
                        var response = response_wrapper.data;
                        var res_items = [];
                        if(response && response.head_info && (response.head_info.length > 0)){
                            for(var i = 0; i < response.head_info.length; i++){
                                var item = response.head_info[i];
                                var detail_image_info = response.detail_info[item.id];
                                var detail_images = [];
                                var detail_images_thumb = [];
                                if(detail_image_info){
                                    detail_images = detail_image_info.map(function(v){
                                        return v.image_url;
                                    });
                                    detail_images_thumb = detail_image_info.map(function(v){
                                        return v.image_url_thumb;
                                    });
                                }
                                res_items.push({
                                    id: item.id,
                                    name: item.name,
                                    lat: item.lat,
                                    lng: item.lng,
                                    zip_no: item.zip_no,
                                    address: item.address,
                                    caption: item.caption,
                                    prefecture: item.pref,
                                    season: item.season,
                                    accessibility: item.accessibility,
                                    crowdness: item.crowdness,
                                    image_url: item.image_url,
                                    images: detail_images,
                                    images_thumb: detail_images_thumb,
                                    visit_date: item.visit_date
                                });
                            }
                        }
                        return res_items;
                    }
                );
            }
        });
})();
