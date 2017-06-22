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
        // このあたりで初回ロードか否かを判定するためのlocalStorageをセットしておく

        angular.bootstrap(document, ['MHM-APP']);

        angular.element("#initial-view").animate({
            opacity: 0
        }, 100)
        .queue(function(){
            this.remove();
        })

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
                .when("/detail/:name", {
                    templateUrl: "js/view/detail.html",
                    controller: "DetailController"
                })
                .otherwise({
                    redirectTo: "/"
                });
            $locationProvider.hashPrefix('');
            //$locationProvider.html5Mode(true);
            $locationProvider.html5Mode(false);
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

            // 検索条件のリスト. 文字解釈にも使用する
            $scope.area_list = [
                {id: "", name: "(指定なし)"},
                {id: "北海道-青森-岩手-宮城-秋田-山形-福島", name: "北海道/東北"},
                {id: "茨城-栃木-群馬-埼玉-千葉-東京-神奈川", name: "関東"},
                {id: "新潟-富山-石川-福井-山梨-長野-岐阜-静岡-愛知-三重", name: "中部"},
                {id: "滋賀-京都-大阪-兵庫-奈良-和歌山", name: "近畿"},
                {id: "鳥取-島根-岡山-広島-山口", name: "中国"},
                {id: "徳島-香川-愛媛-高知", name: "四国"},
                {id: "福岡-佐賀-長崎-熊本-大分-宮崎-鹿児島-沖縄", name: "九州/沖縄"}
            ];
            $scope.pref_list = ["北海道", "青森", "岩手", "宮城", "秋田", "山形", "福島", "茨城", "栃木", "群馬", "埼玉", "千葉", "東京", "神奈川", "新潟", "富山", "石川", "福井", "山梨", "長野", "岐阜", "静岡", "愛知", "三重", "滋賀", "京都", "大阪", "兵庫", "奈良", "和歌山", "鳥取", "島根", "岡山", "広島", "山口", "徳島", "香川", "愛媛", "高知", "福岡", "佐賀", "長崎", "熊本", "大分", "宮崎", "鹿児島", "沖縄"];
            $scope.type_list = [
                {id: "",  name: "(指定なし)"},
                {id: "N", name: "自然の景色"},
                {id: "B", name: "建造物"},
                {id: "P", name: "プレイスポット"},
                //{id: "H", name: "宿"}
            ];
            $scope.type2_list = [
                {id: "",  name: "(指定なし)"},
                {id: "HL", name: "高原"},
                {id: "MT", name: "山"},
                {id: "RV", name: "川"},
                {id: "FR", name: "森"},
                {id: "GF", name: "草原"},
                {id: "SE", name: "海"},
                {id: "LK", name: "湖"},
                {id: "WE", name: "湿原"},
                {id: "RD", name: "道"},
                {id: "PR", name: "岬"},
                {id: "PA", name: "峠"},
                {id: "OB", name: "展望スポット"},
                {id: "PK", name: "公園"},
                {id: "MU", name: "美術館など"},
                {id: "VA", name: "渓谷"},
                {id: "FA", name: "滝"},
                {id: "TP", name: "テーマパーク"},
                {id: "FJ", name: "富士山ビュースポット"},
                {id: "CB", name: "桜/梅ビュースポット"},
                {id: "OS", name: "昔の街並み"},
                {id: "BL", name: "建造物"},
                {id: "SS", name: "観光地"},
                {id: "FW", name: "お花スポット"},
                {id: "RW", name: "ロープウェイ/リフト"},
                {id: "RL", name: "紅葉スポット"},
                {id: "WH", name: "世界遺産"},
                {id: "NV", name: "夜景が綺麗"},
                {id: "SI", name: "静か"},
                {id: "NJ", name: "日本じゃないみたい"},
                {id: "TN", name: "棚田"},
                {id: "RH", name: "休憩施設など"},
                {id: "AN", name: "動物"}
            ];
            $scope.score_list = [
                {id: "8", name: "最高の絶景のみ！"},
                {id: "5", name: "良景以上"},
                {id: "",  name: "すべて"}
            ];
            $scope.order_list = [
                //{id: "", name: "(ソート指定なし)"},
                {id: "o_rec-d", name: "オススメ順"},
                {id: "o_new-d", name: "新しい順"},
                {id: "o_new-a", name: "古い順"},
                {id: "o_cro-a", name: "混雑度低い順"},
                {id: "o_cro-d", name: "混雑度高い順"},
                {id: "o_acc-d", name: "アクセスし易い順"},
                {id: "o_acc-a", name: "アクセスし難い順"}
            ];

            // メッセージ表示に関するobject
            $scope.message_info = {
                message: "",
                show: false,
                status: ""
            };

            // 変更可能なグローバル値
            $scope.binding = {
                title : "全国の絶景",
                is_admin: false,
                is_detail_page: false
            };

            var tag_map = {};
            for(var key in $scope.type2_list)
                tag_map = $scope.type2_list[key];

            // ---------- methods -------i---
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
            $scope.getName = function(s, name){
                if(!$scope[name]) return s;

                for(var i = 0; i < $scope[name].length; i++){
                    if(s == $scope[name][i].id) return $scope[name][i].name;
                }
                
                return s;
            };
            $scope.$on('$routeChangeStart', function(ev, current){
                // 現在ページ状態を判定
                $scope.binding.is_detail_page = (current.$$route.originalPath.indexOf("/detail/") >= 0);

                console.log("main-> routeChangeStart");
                /*
                console.log(ev);
                console.log(current);
                */
            });
        })
        // 改行をbrに変換する
        .filter('conv2br', function() {
            return function(s){
                return s ? s.replace(/\/br/g, "\n") : s;
            };
        })
        // Header-Detail画面で値のやり取りに使用. 既に検索しているheader情報や選択しているindexの値を保持する
        .service("CurrentState", function(){
            this.searchedItems = [];
            this.index = -1;
            this.selectedTab = window.StorageManager_Settings.get("selectedTab") || "C";
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
                                    gmap_by_latlng: item.gmap_by_latlng == "1",
                                    image_url: item.image_url,
                                    detail_info: response.detail_info[item.id],
                                    tag_info: response.tag_info[item.id]
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