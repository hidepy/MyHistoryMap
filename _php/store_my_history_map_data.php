<?php

$callback = $_GET['callback'];

if(isset($callback)){

	$output = array(
    	"label1"=>"data1",
    	"label2"=>"data2"
	);

	$res = array();

	for($i = 0; $i < 8; $i++){
		$res[] = array("id" => $i, "name" => "name(".$i.")");
	}

	header( 'Content-Type: text/javascript; charset=utf-8' );
	//GETかPOSTかは$.ajax側の設定次第？
	echo $callback . "(" . json_encode($res). ")";

	}

?>