(function(){
    'use strict';

	angular.module('MHM-APP')
        .controller('DetailController', function($scope, $timeout, $routeParams, CurrentState, MapPointDataAdapter) {

            // 前画面で選択された場所情報を格納する
            $scope.selected_item = {};
            // thumbnail選択された詳細情報を格納する
            $scope.selected_item_detail = {};

            // first select img index
            $scope.selected_img_index = 0;

            // carousel 有効/無効制御
            $scope.thumbLoaded = false;

            // slick(carouselのやつ)の設定
            $scope.slickConfig = {
                //enabled: true,
                dots: true,
                centerMode: true,
                infinite: false,
                centerPadding: '30px',
                slidesToShow: 1,
                focusOnSelect: true,
                //asNavFor: "#slick-main",
                responsive: [
                    {
                      breakpoint: 1024,
                      settings: {
                        slidesToShow: 1,
                        //slidesToScroll: 1,
                        //infinite: true,
                        dots: true
                      }
                    },
                    {
                      breakpoint: 600,
                      settings: {
                        arrows: false,
                        centerMode: true,
                        centerPadding: '40px',
                        slidesToShow: 1
                      }
                    },
                    {
                      breakpoint: 480,
                      settings: {
                        arrows: false,
                        centerMode: true,
                        centerPadding: '40px',
                        slidesToShow: 1
                      }
                    }
                  ],
                method: {},
                event: {
                    afterChange: function (event, slick, currentSlide, nextSlide) {
                        $scope.selected_img_index = currentSlide;
                        $scope.selected_item_detail = $scope.selected_item.detail_info[currentSlide];
                    }
                }
            };

            // initialize
            $scope.init = function(){

                console.log("DetailController init");
                //console.log($routeParams.name);

                $scope.selected_img_index = 0;

                function setup(item){
console.log("in setup function");

                    $scope.selected_item = item;
                    $scope.selected_item_detail = item.detail_info ? 
                        item.detail_info[$scope.selected_img_index]
                        : {
                            "id": "",
                            "seq": "",
                            "image_url": "",
                            "image_url_thumb": "",
                            "comment": "",
                            "visit_date": "",
                            "month": "",
                            "timing_of_month": "",
                            "author": "",
                            "recomend": ""
                        };

                    // carousel setup
                    $timeout(function(){
                        $scope.thumbLoaded = true;
                    }, 1);
                }

                // 苗画面有で、名称が一致する場所情報を保有していれば
                if(CurrentState.searchedItems 
                    && (CurrentState.index >= 0 && CurrentState.index < CurrentState.searchedItems.length)
                    && (CurrentState.searchedItems.filter(v=>v.name == $routeParams.name).length > 0)
                ){
                    console.log("satisfy first root detai init");
                    // 画面表示用にデータコピーなど...
                    setup(CurrentState.searchedItems[CurrentState.index]);
                }
                // 詳細画面直できた場合
                else{

console.log("unsatisfy first root detai init... try to get detail info");

                    // 詳細画面フラグ(=戻る/タイトルへボタンの制御)を折る.　戻った時にブラウザ戻るじゃなくてホームへ戻って欲しい
                    $scope.binding.is_detail_page = false;

                    // 名称からデータを検索する
                    MapPointDataAdapter.getData({
                        w_pref : "",
                        w_ptype: "",
                        w_score: "",
                        w_name : $routeParams.name  || "",
                        w_hasnoimg : "",
                        order  : ""
                    })
                        .then(function(items){
console.log("detail MapPointDataAdapter callback.  items=");
                            // レコードなしの場合
                            if(!items || !items[0]){
                                $scope.selected_item.name = "(データなし)";
                                $scope.is_detail_page = false;
                            }
                            // レコードがあった場合
                            else{
                                // 画面表示用にデータコピーなど...共通処理へ
                                setup(items[0]);
                            }
                        });
                }
            };

            $scope.selectThumbnailImg = function(index){
                $scope.selected_img_index = index;
                $scope.selected_item_detail = $scope.selected_item.detail_info[$scope.selected_img_index];
            };

            // event when location change
            //   to close lightbox
            $scope.$on('$locationChangeStart', function(event, next, current){
                // Here you can take the control and call your own functions:
                //alert('Sorry ! Back Button is disabled');
                // Prevent the browser default action (Going back):
                //event.preventDefault();            
            });
        });
})();
