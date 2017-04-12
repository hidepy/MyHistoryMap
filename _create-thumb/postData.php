<?php
require("ImgHandler.php");

define("MAX_FETCH_FILE_DEFAULT", 24);


//session_start();

// return object definition
$if_return = array("return_cd"=> 0, "msg"=> "", "item"=> "");

if(isset($_POST["DO_RESIZE"])){

	// iniファイル読込
	$configs = parse_ini_file("../appsettings.ini", true);
	if(!$configs){
	  die("cannot open ini file...");
	} 

	// imgHandler生成
	$imghandler = new ImgHandler(
		$configs["hellothumb"]["output_dir_main"],
		$configs["hellothumb"]["output_dir_thumb"], 
		$configs["hellothumb"]["watermark_path"],
		$configs["hellothumb"]["delete_original"],
		$configs["hellothumb"]["watermark_opacity"]
	);

	if($_SESSION == $_POST["token"]){
		$if_return = "YOU'RE VALID!!";
	}

	// sync exec resize.
	if($_POST["DO_RESIZE"] == "togatherAtOnce"){ // deprecated...
		try{
			// get max operation num
			$max_fetch_str = isset($_POST["MAX_FETCH_NUM"]) ? $_POST["MAX_FETCH_NUM"] : "".MAX_FETCH_FILE_DEFAULT;
			$max_fetch = ctype_digit($max_fetch_str) ? intval($max_fetch_str) : MAX_FETCH_FILE_DEFAULT;

			// get operation directory
			$input_dir = $configs["hellothumb"]["input_dir"];
			$files = scandir($input_dir);

			$loop_max = count($files) > MAX_FETCH_FILE_DEFAULT ? MAX_FETCH_FILE_DEFAULT : count($files);
			$exec_count = 0;

			// result variable
			$result_filepath = array();

			// create imgs
			for($i = 0; $i < $loop_max; $i++){
				$file = $files[$i];

				//$path = dirname(__FILE__)."/tmp/".$file;
				$path = $input_dir.$file;

				if(!is_dir($path)){
					$result_filepath[] = $imghandler->createImgForMHM($path);
					$exec_count++;
					
					if($exec_count >= $max_fetch){
						break;
					}
				}
			}

			$if_return["item"] = $result_filepath;

			// not created img...
			if($exec_count <= 0){
				$if_return["return_cd"] = 1;
				$if_return["msg"] .= "no data...";
			}
		}
		catch(Exception $e){
			$if_return["return_cd"] = 9;
			$if_return["msg"] = $e->getMessage();
		}
		finally{
			header("Content-Type: application/json; charset=utf-8");
			echo json_encode($if_return);
			exit();
		}
	}
	// 廃止...
	/*
	else if($_POST["DO_RESIZE"] == "Each"){ // true!!
		if(!isset($_POST["TARGET_PATH"])){
			$if_return["msg"] = "no source found...";

			header("Content-Type: application/json; charset=utf-8");
			echo json_encode($if_return);
			exit();
		}

		try{

		}
		catch(Exception $e){

		}
		finally{
			header("Content-Type: application/json; charset=utf-8");
			echo json_encode($if_return);
			exit();
		}
	}
	*/
	else if($_POST["DO_RESIZE"] == "GetFiles"){

		$res = array();
		$input_dir = $configs["hellothumb"]["input_dir"];
		$files = scandir($input_dir);

		foreach($files as $file){
			$path = dirname(__FILE__).$input_dir.$file;

			if(!is_dir($path)) 
				$res[] = $path;
		}

		$if_return["item"] = $res;

		header("Content-Type: application/json; charset=utf-8");
		echo json_encode($if_return);
		exit();
	}
	else if($_POST["DO_RESIZE"] == "DUMMY"){
		$if_return["item"] = array("main"=> "nodata");
		header("Content-Type: application/json; charset=utf-8");
		echo json_encode($if_return);
		exit();
	}
}

// admin判定
$is_admin_user = false;
if(isset($_GET["adminkey"])){
	$configs_common = parse_ini_file("../dbconfig.ini", true);
	$is_admin_user = (md5($_GET["adminkey"]) == $configs_common["common"]["adminkey"]);
}

if(!$is_admin_user){
	die("no auth...");
}


$token = md5(uniqid(rand(), true));
$_SESSION["token"] = $token;

?>

<html>
<head>
	<meta name="robots" content="noindex" />

	<title>Hello, Thumb</title>

	<style>
	#loading-wrapper{
		display: none;
		position: absolute;
		top: 0px;
		right: 0px;
		bottom: 0px;
		left: 0px;
		margin: auto;
		width: 128px;
		height: 32px;
		opacity: 0.0;
	}
	#loading-wrapper > img{
		width: 100%;
	}
	</style>

	<script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js"></script>

	<script>
		document.addEventListener("DOMContentLoaded", function(){
			var PROC_TYPE = "togatherAtOnce"; // togatherAtOnce or Each or GetFiles

			document.getElementById("exec").addEventListener("click", function(){
				jQuery.ajax({
					type: "POST",
					url: "postData.php",
					data: "DO_RESIZE=" + PROC_TYPE + "&MAX_FETCH_NUM=" + document.getElementById("max-fetch-num").value + "&token=" + document.getElementById("token").value,
					beforeSend: function(){
						document.getElementById("loading-wrapper").style.display = "inline";
						jQuery("#loading-wrapper").animate({
							opacity: 1.0
						}, 500);
					},
					success: function(data){
						if(data.item && (data.return_cd == 0)){
							data.item.map(function(v){
								var el_ul = document.createElement("ul");
								el_ul.id = v.main;
								el_ul.innerHTML = ["main", "thumb", "is_deleted"].reduce(function(p, c){
									return p + "<li>" + c + " = " + v[c] + "</li>";
								}, "");
								return el_ul;
							}).forEach(function(v){
								document.getElementById("result").appendChild(v);
							});
						}
						else if(data.return_cd == 1){
							document.getElementById("result").innerHTML = "NO DATA...";
						}
						else{
							document.getElementById("result").innerHTML = "FATAL ERROR...";
						}
					},
					error: function(){
						alert("fatal error occurred... on ajax");
					},
					complete: function(){
						jQuery("#loading-wrapper").animate({
							opacity: 0.0
						}, 250, function(){
							this.style.display = "none";
						});
					}
				});
			});

			// 以下廃止... 本来は、1ファイルずつ処理実行しようと思っていたが、オーバーヘッドがすごいのでやめます。
			/*
			document.getElementById("exec_each").addEventListener("click", function(){
				jQuery.ajax({
					type: "POST",
					url: "postData.php",
					data: "DO_RESIZE=GetFiles",
					success: function(data){
						if(data.item){
							document.getElementById("filelist").innerHTML = data.item.map(function(v){
								return "<li>" + v + "</li>";
							}).join("");

							console.log(data.item);
							return data.item;
						}
					}
				})
				.then(function(data_str) {
					
					var parsed_data = JSON.parse(data_str);

					// itemsは受け取るが、実際はli listから取得する→後でステータス更新するため
					items = parsed_data.item;

					if(!!items && (items.length > 0)){
						function sequentialExec(item){
							return jQuery.ajax({
								type: "POST",
								url: "postData.php",
								data: "DUMMY=true&token=" + document.getElementById("token").value,
								success: function(res){
									console.log("resize success!!");
									console.log(res);	
								}
							});
						}

						var SAFETY = 20;

						function dig(i){
							console.log("in dig. i=" + i);
							if((i > items.length) || (i > SAFETY)){ return; }

							sequentialExec(items[i]).then(arguments.callee(i + 1));
						}

						dig(0, items.length);
					}
				});
			});
			*/
		});
	</script>
</head>
<body>
	<header>
		<h2>Hello, Thumb</h2>
		<p>Hellp, Thumb create two resized image.</p>
		<p>one is large, the other is small.</p>
		<p>put file want to resize into ./tmp/, then push 「GENERATE!!」 once.</p>
		<p>when success, result images appear in ./main/ and ./thumb/ , and ./tmp/ file will disappear.</p>
		<p>Tsumari, tmp ni image file oite, 「GENERATE!!」 button wo oshite, toiukoto.</p>
	</header>
	<section>
		<!--
		<div>
			<button id="exec_each">DO!!</button><button id="stop_each">STOP</button>
			<ul id="filelist">
			</ul>
		</div>
		-->

		<div>
			<label for="max-fetch-num">max fetch num:</label>
			<input id="max-fetch-num" value="<?=MAX_FETCH_FILE_DEFAULT?>"/>
			<button id="exec">GENERATE!!</button>
		</div>

		<div id="result-wrapper">
			<h4>Operation Result↓</h4>
			<div id="result"></div>
		</div>
	
		<input id="token" type="hidden" value="<?=$token?>">
	</section>

	<div id="loading-wrapper">
		<img src="support-loading.gif">
	</div>
</body>
</html>