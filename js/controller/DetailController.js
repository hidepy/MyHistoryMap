(function(){
    'use strict';

	angular.module('MHM-APP')
        .controller('DetailController', function($scope, $timeout, CurrentState) {

            // 前画面で選択された場所情報を格納する
            $scope.selected_item = {};
            // thumbnail選択された詳細情報を格納する
            $scope.selected_item_detail = {};

            // first select img index
            $scope.selected_img_index = 0;

            // carousel 有効/無効制御
            $scope.thumbLoaded = false;

            // slick-mainの設定
            /*
            $scope.slickMainConfig = {
                slidesToShow: 1,
                slidesToScroll: 1,
                arrows: false,
                fade: true,
                asNavFor: '#thumbnail-carousel'
            };
            */

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

                // carousel setup
                $timeout(function(){
                    $scope.selected_img_index = 0;
                    $scope.selected_item = CurrentState.searchedItems[CurrentState.index];
                    $scope.selected_item_detail = $scope.selected_item.detail_info ? 
                        $scope.selected_item.detail_info[$scope.selected_img_index]
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
                    $scope.thumbLoaded = true;
                }, 1);
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
