<html ng-app="app">
<head>

  <meta charset="utf-8">

  <title>今までいった所をマークするよっ！</title>

  <link rel="stylesheet" type="text/css" href="bootstrap3/css/bootstrap.min.css">
  <link rel="stylesheet" type="text/css" href="css/my_history_map.css">

  <script src="http://maps.googleapis.com/maps/api/js?key=AIzaSyB0HuGNOkJMH3EnJTnEZBTv_Ue7BQhree4&sensor=false"></script>
  <!--<script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/1.5.1/jquery.min.js"></script>-->
  <script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js"></script>
  <script type="text/javascript" src="js/MapPointData.js"></script>
  <script type="text/javascript" src="js/my_history_manager.js"></script>

  <script src="lib/angular/angular.js"></script>
  <script src="lib/angular/checklist-model.js"></script>
  <script src="js/app.js"></script>

  <link rel="stylesheet" type="text/css" href="lib/lightbox/css/lightbox.css">

  <script type="text/javascript">
    $(function(){

      $('.thumb_img div').hover(function(){
          // マウスオーバーしている画像をメインの画像に反映
          $('.main_img a').css('background-image', $(this).css('background-image'));
      });
    });
  </script>

</head>

<body ng-controller="AppController">

  <nav id="top_navigation" class="navbar navbar-inverse navbar-fixed-top">
    <div class="container">
      <div class="navbar-header">
        <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#navbar" aria-expanded="false" aria-controls="navbar">
          <span class="sr-only">Toggle navigation</span>
          <span class="icon-bar"></span>
          <span class="icon-bar"></span>
          <span class="icon-bar"></span>
        </button>
        <a class="navbar-brand" href="#">My History Map</a>
      </div>
      <div id="navbar" class="navbar-collapse collapse">
        <form class="navbar-form navbar-right">
          <div class="form-group">
            <input type="text" placeholder="Email" class="form-control">
          </div>
          <div class="form-group">
            <input type="password" placeholder="Password" class="form-control">
          </div>
          <button type="submit" class="btn btn-success">Sign in</button>
        </form>
      </div><!--/.navbar-collapse -->
    </div>
  </nav>

  <!-- Main jumbotron for a primary marketing message or call to action -->
  <div id="header" class="jumbotron">
    <div class="container">
      <!--<h1>今までいった所を保存するよっ！</h1>-->
      <h1>My History Map</h1>
      <p>色々な所を旅してきましたね。<br>でも、なかなかパッと何処にいったか思い出せません。<br>
      そこで！このツールに保存しておきましょう</p>
      <button class="btn" ng-click="pushStart()">Start</button>
    </div>
  </div>

  <div id="contents">
    <div class="container">
    <div class="row">

      <div class="col-md-4">
        <div id="history_map"></div>
      </div>

      <!--くろい枠内のどこでもクリックすると、情報のマーカーをうつよ！
      ちなみに、情報はサーバーのMysqlからもらってきているよ！-->

      <div id="detail" class="col-md-8">
        <div class="img_box clearfix">
          <div class="main_img">
            <a href="{{selected_item.image_url}}" data-lightbox="main_images" data-title="{{selected_item.name}}" ng-style="{'background-image': 'url('+ selected_item.image_url +')'}"></a>
          </div>
          <ul class="thumb_group">
            <li class="thumb_img"><div ng-style="{'background-image': 'url('+ selected_item.image_url +')'}"></div></li>
            <li class="thumb_img"><div ng-style="{'background-image': 'url('+ selected_item.image_url2 +')'}"></div></li>
            <li class="thumb_img"><div ng-style="{'background-image': 'url('+ selected_item.image_url3 +')'}"></div></li>
          </ul>
        </div>

        <div class="card">
          <div class="card_heading">
            <h2>{{selected_item.name}}</h2>
          </div>

          <div class="card_body clearfix">
            <div class="left_area">
              <span class="item_name">住所</span>
              <p>{{selected_item.zip_no}}<br>
              {{selected_item.address}}</p>

              <span class="item_name">訪れた日</span>
              <p>{{selected_item.visit_date}}</p>

              <span class="item_name">コメント</span>
              <p>{{selected_item.caption}}</p>
            </div>
            <!--<div>{{selected_item.prefecture}}</div>-->
            <div class="right_area">
              <ul>
                <li class="box"><span class="item_name">季節</span>
                <p>{{selected_item.season}}</p></li>
                <li class="box"><span class="item_name">見頃</span>
                <p>{{selected_item.season_monthly}}</p></li>
                <li class="box"><span class="item_name">行きやすさ</span>
                <p>{{selected_item.accessibility}}</p></li>
                <li class="box"><span class="item_name">混雑度</span>
                <p>{{selected_item.crowdness}}</p></li>
              </ul>
            </div>
          </div>
        </div><!-- /.card -->
      </div><!-- /#detail -->

    </div><!-- /.row -->

    <div id="my_history" class="row">
      <div class="col-md-3 col_space10" ng-repeat="item in items" ng-click="selectMapData($index, $event)">
          <div class="panel">
            <div class="panel-heading">
              <div class="panel_img" ng-style="{'background-image': 'url('+ item.image_url +')'}"></div>
              <div class="ravel">
                <span class="season">{{item.season}}</span>
                <span class="prefecture">{{item.prefecture}}</span>
              </div>
            </div>
            <div class="panel-body">
              {{item.name}}
            </div>
          </div>
      </div>
    </div><!-- /#my_history -->

    <div>
      <button ng-click="deleteMarkers()">マーカーを削除</button>
    </div>

  </div> <!-- /.container -->
</div> <!-- /#contents -->

<script src="lib/lightbox/js/lightbox.js"></script>
</body>
</html>
