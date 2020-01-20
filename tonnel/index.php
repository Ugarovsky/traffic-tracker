<?php

$PATH = '/fbtoolnew30/tonnel/';

header('Access-Control-Allow-Origin: *');

$request_uri = str_replace($PATH, '', $_SERVER['REQUEST_URI']);
$url = 'https://fbtool.pro/api/'. $request_uri;

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$r = curl_exec($ch);
curl_close($ch);

header('Content-Type: application/json');
echo($r);

?>