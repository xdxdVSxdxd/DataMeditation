<?php
header("Access-Control-Allow-Origin: *");

require_once("db.php");

function utf8ize($d) {
    if (is_array($d)) 
        foreach ($d as $k => $v) 
            $d[$k] = utf8ize($v);

     else if(is_object($d))
        foreach ($d as $k => $v) 
            $d->$k = utf8ize($v);

     else 
        return utf8_encode($d);

    return $d;
}


function doLogin($request,$conn){
	$result = new \stdClass();

	$q = "SELECT id,pwd FROM users WHERE login=:login LIMIT 0,1";
	$stmt = $conn->prepare($q);
	$stmt->execute([':login' => $request["login"] ]);
	$user = $stmt->fetch();

	if ($user && password_verify($request["password"], $user['pwd']))
	{
	    $result->login = $request["login"];
	    $result->iduser = $user['id'];
	} else {
	    $result->error = "Unknown user. Register?";
	}

	return $result;	
}

function doRegister($request,$conn){
	$result = new \stdClass();

	return $result;	
}

function doSigninToGroup($request,$conn){
	$result = new \stdClass();

	return $result;	
}

function doStoreData($request,$conn){
	$result = new \stdClass();

	return $result;	
}

function doListUsersInGroups($request,$conn){
	$result = new \stdClass();

	return $result;	
}

function doJoinRitual($request,$conn){
	$result = new \stdClass();

	return $result;	
}

function doGetMyCouple($request,$conn){
	$result = new \stdClass();

	return $result;	
}

function doGetMyCoupleDataForRitual($request,$conn){
	$result = new \stdClass();

	return $result;	
}

function doEndRitualStatus($request,$conn){
	$result = new \stdClass();

	return $result;	
}

function doCreateCouples($request,$conn){
	$result = new \stdClass();

	return $result;	
}

function doRemoveCouples($request,$conn){
	$result = new \stdClass();

	return $result;	
}


$cmd = $_REQUEST["cmd"];

$result = new \stdClass();

if($cmd=="login"){
	$result = doLogin($_REQUEST,$conn);
} else if($cmd=="register"){
	$result = doRegister($_REQUEST,$conn);
} else if($cmd=="togroup"){
	$result = doSigninToGroup($_REQUEST,$conn);
} else if($cmd=="updata"){
	$result = doStoreData($_REQUEST,$conn);
} else if($cmd=="listgroup"){
	$result = doListUsersInGroups($_REQUEST,$conn);
} else if($cmd=="joinritual"){
	$result = doJoinRitual($_REQUEST,$conn);
} else if($cmd=="getmycouple"){
	$result = doGetMyCouple($_REQUEST,$conn);
} else if($cmd=="getmycoupledataforritual"){
	$result = doGetMyCoupleDataForRitual($_REQUEST,$conn);
} else if($cmd=="endritualstatus"){
	$result = doEndRitualStatus($_REQUEST,$conn);
} else if($cmd=="createcouples"){
	$result = doCreateCouples($_REQUEST,$conn);
} else if($cmd=="removecouples"){
	$result = doRemoveCouples($_REQUEST,$conn);
} else {
	$result->err = "Error. Command not understood.";
}
	


header('Content-type: application/json');


echo(json_encode(utf8ize($result)));

?>