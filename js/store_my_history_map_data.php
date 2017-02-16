<?php

$callback = $_GET['callback'];

if(isset($callback)){

	//$con = mysql_connect("localhost",  "hidork0222", "koritaso1117");
	$con = mysql_connect("mysql118.phy.lolipop.lan",  "LAA0758614", "koritaso1117");

	if (!$con) {
	    die("cannot open connection...".mysql_error());
	}

	//接続成功の場合

	$db = mysql_select_db("LAA0758614-mhm", $con);

	if(!$db){
		die("cannot select db...".mysql_error());
	}

	//DB選択成功の場合

	$query = "
	SELECT
	  p_name
	  ,name
	  ,lat
	  ,lng
	  ,prefecture
	  ,season
	  ,season_weekly
	  ,zip_no
	  ,address
	  ,caption
	  ,accessibility
	  ,crowdness
	  ,image_url
	FROM
	  MHM_M_POINT_DATA
	";

	$select_res = mysql_query($query);



	$res = array();

	while($r = mysql_fetch_assoc($select_res)){
		$res[] = array(
			"id"=>$r["p_name"],
			"name"=>$r["name"],
			"lat"=>"lat",
			"lng"=>"lng",
			"pref"=>"prefecture",
			"zip_no"=>"zip_no",
			"address"=>"address",
			"caption"=>"caption",
			"season"=>"season",
			"season_monthly"=>"season_weekly",
			"accessibility"=>"accessibility",
			"crowdness"=>"crowdness",
			"image_url"=>"image_url"
			/*
			"lat"=>$r["lat"],
			"lng"=>$r["lng"],
			"pref"=>$r["prefecture"],
			"zip_no"=>$r["zip_no"],
			"address"=>$r["address"],
			"caption"=>$r["caption"],
			"season"=>$r["season"],
			"season_monthly"=>$r["season_weekly"],
			"accessibility"=>$r["accessibility"],
			"crowdness"=>$r["crowdness"],
			"image_url"=>$r["image_url"]
			*/
		);
	}


/*
	for($i = 0; $i < 5; $i++){
		$res[] = array("id"=>$i, "name"=>"name(".$i.")", "caption"=>"ここが説明文になりますよ", "lat"=>(32 + $i), "lng"=>(138 - $i));
	}
	*/

	header( 'Content-Type: text/javascript; charset=utf-8' );

	//GETかPOSTかは$.ajax側の設定次第？
	echo $callback . "(" . json_encode($res). ")";


	$close_flag = mysql_close($con);


}

?>
