(function(){
    'use strict';

    // load event
    // normal javascript
    document.addEventListener("DOMContentLoaded", function(){
        // 本来は、angularの世界なんでservice化すべきとも思うが...angular以外でも使い回ししたいんで
        window.StorageManager_Fav = new StorageManager("MHM-Favorite");
        window.StorageManager_Settings = new StorageManager("MHM-Settings");

        window.CommonFunctions = {
            formatDate: function(date){
                return ("" + date.getFullYear() + ("00" + (date.getMonth() + 1)).slice(-2) + ("00" + date.getDate()).slice(-2) + ("00" + date.getHours()).slice(-2) + ("00" + date.getMinutes()).slice(-2) + ("00" + date.getSeconds()).slice(-2) );
            },
            isEmpty: function(s){
                return (s == null) || (s == undefined) || (s == "");
            }
        };
    });

    // angular module setup
    // create MHM-APP 
   angular.module('MHM-APP', ['ngRoute', 'slickCarousel', 'MapHandlerService'])

        .config(function($routeProvider, $locationProvider){
            $routeProvider
                .when("/", {
                    templateUrl: "js/view/main.html",
                    controller: "HeaderController"
                })
                .when("/detail/", {
                    templateUrl: "js/view/detail.html",
                    controller: "DetailController"
                })
                .otherwise({
                    redirectTo: "/"
                });
            $locationProvider.hashPrefix('');
            $locationProvider.html5Mode(true);
        })
        .controller('RootController', function($scope, $location, $timeout){

            // ---------- properties ----------
            // Markerの色をplace_typeから決定するためのmap
            $scope.PLACE_COLOR_MAP = {
                "N": {
                    body: "#80d080",
                    line: "#50a050"
                },
                "B": {
                    body: "#d08070",
                    line: "#a05040"
                },
                "P": {
                    body: "#eeee60",
                    line: "#bebe30"
                },
                "H": {
                    body: "#606060",
                    line: "#303030"
                }
            };
            // monthからseasonを返す
            $scope.MONTH_SEASON_MAP = {
                "3": "SPRI", "4": "SPRI", "5": "SPRI",
                "6": "SUMM", "7": "SUMM", "8": "SUMM",
                "9": "AUTU", "10":"AUTU", "11":"AUTU",
                "12":"WINT", "1": "WINT", "2": "WINT"
            };

            // メッセージ表示に関するobject
            $scope.message_info = {
                message: "",
                show: false,
                status: ""
            };

            // ---------- methods ----------
            $scope.showMessage = function(message, status){
                $scope.message_info.message = message;
                $scope.message_info.status = status || "alert-info";
                $scope.message_info.show = true;
                $timeout(function(){
                    $scope.message_info.show = false;
                }, 3000);

            };
            $scope.move = function(path, param){
                $location.path(path).search(param || {});
            };
            $scope.getCurrentPage = function(){
                return $location.path();
            };
            $scope.isDetailPage = function(){
                return $scope.getCurrentPage() == "/detail/";
            };
        })
        // Header-Detail画面で値のやり取りに使用. 既に検索しているheader情報や選択しているindexの値を保持する
        .service("CurrentState", function(){
            this.searchedItems = [];
            this.index = -1;
            this.selectedTab = window.StorageManager_Settings.get("selectedTab") || "M";
            this.searchCondition = {};
        })
        .service("MapPointDataAdapter", function($http){
            this.getData = function(param){
                var query_string = "needonlydata=true";
                for(var p in param){
                    query_string += "&" + p + "=" + param[p];
                }
                return $http.jsonp("index.php" + "?" + query_string, {jsonpCallbackParam: 'callback'})
                    // 戻りはpromiseオブジェクトなんで
                    .then(function(response_wrapper){
                        var response = response_wrapper.data;
                        var res_items = [];
                        if(response && response.head_info && (response.head_info.length > 0)){
                            for(var i = 0; i < response.head_info.length; i++){
                                var item = response.head_info[i];
                                res_items.push({
                                    id: item.id,
                                    name: item.name,
                                    lat: item.lat,
                                    lng: item.lng,
                                    prefecture: item.pref,
                                    zip_no: item.zip_no,
                                    address: item.address,
                                    caption: item.caption,
                                    favorite: item.favorite,
                                    accessibility: item.accessibility,
                                    crowdness: item.crowdness,
                                    place_type: item.place_type,
                                    image_url: item.image_url,
                                    detail_info: response.detail_info[item.id]
                                });
                            }
                        }
console.log("in MapPointDataAdapter getData success");
                        return res_items;
                    }
                );
            }
        });
})();




// Given:
// URL: http://server.com/index.html#/Chapter/1/Section/2?search=moby
// Route: /Chapter/:chapterId/Section/:sectionId
//
// Then
//$routeParams ==> {chapterId:'1', sectionId:'2', search:'moby'}