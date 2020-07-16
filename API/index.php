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

	// if user does not esist
	$q = "SELECT id FROM users WHERE login=:login LIMIT 0,1";
	$stmt = $conn->prepare($q);
	$stmt->execute([':login' => $request["login"] ]);
	$user = $stmt->fetch();

	// register
	if(!$user || $user==NULL){
		$q = "INSERT INTO users(login,pwd) VALUES( :login , :pwd )";
		$stmt = $conn->prepare($q);
		$stmt->execute([':login' => $request["login"]  ,   ':pwd' => password_hash($request["password"],PASSWORD_DEFAULT)    ]);

		$result->login = $request["login"];
	    $result->iduser = $conn->lastInsertId();

	} else {
		$result->error = "User already exists.";
	}

	return $result;	
}

function doSigninToGroup($request,$conn){
	$result = new \stdClass();

	$q = "SELECT id FROM groups WHERE groupname=:groupname LIMIT 0,1";
	$stmt = $conn->prepare($q);
	$stmt->execute([':groupname' => $request["groupid"] ]);
	$group = $stmt->fetch();

	if(!$group || $group==NULL){
		//insert group and produce data
		$q = "INSERT INTO groups(groupname) VALUES( :groupname )";
		$stmt = $conn->prepare($q);
		$stmt->execute([':groupname' => $request["groupid"] ]);

		$result->group = $request["groupid"];
	    $result->groupid = $conn->lastInsertId();
	} else {
		$result->group = $request["groupid"];
	    $result->groupid = $group["id"];
	}

	//find if there is a previous registration of the user in the gorup
	$q = "SELECT lastlogin FROM users_groups WHERE userid=:userid AND groupid=:groupid LIMIT 0,1";
	$stmt = $conn->prepare($q);
	$stmt->execute([':userid' => $request["iduser"] , ':groupid' => $result->groupid ]);
	$signin = $stmt->fetch();

	if($signin || $signin!=NULL){
		// if there is --> update it
		$q = "UPDATE users_groups SET lastlogin=NOW() WHERE userid=:userid AND groupid=:groupid";
		$stmt = $conn->prepare($q);
		$stmt->execute([':userid' => $request["iduser"] , ':groupid' => $result->groupid ]);

	} else {
		// if there is not --> insert it
		$q = "INSERT INTO users_groups(userid,groupid,lastlogin) VALUES(:userid,:groupid, NOW() )";
		$stmt = $conn->prepare($q);
		$stmt->execute([':userid' => $request["iduser"] , ':groupid' => $result->groupid ]);


	}
	// insert group, groupid and timestamp in result

	$q = "SELECT lastlogin FROM users_groups WHERE userid=:userid AND groupid=:groupid LIMIT 0,1";
	$stmt = $conn->prepare($q);
	$stmt->execute([':userid' => $request["iduser"] , ':groupid' => $result->groupid ]);
	$signin = $stmt->fetch();

	if($signin || $signin!=NULL){
		$result->lastlogin = $signin["lastlogin"];
	} else {
		$result->error = "Could not signin to group";
	}

	return $result;	
}

function doStoreData($request,$conn){
	$result = new \stdClass();

	$q = "INSERT INTO jsondata(userid,groupid,timestamp,jsonstring,year,month,day,hour,minute,second) VALUES(:userid,:groupid, NOW(), :data , :year , :month , :day , :hour , :minute, :second )";
	$stmt = $conn->prepare($q);
	$stmt->execute([':userid' => $request["userid"] , ':groupid' => $request["groupid"] , ":data" => $request["jsondata"]   ,  ":year" => $request["year"] , ":month" => $request["month"] , ":day" => $request["day"] , ":hour" => $request["hour"] , ":minute" => $request["minute"] , ":second" => $request["second"] ] );

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

	$q = "SELECT distinct userid FROM users_groups WHERE groupid = :groupid";
	$stmt = $conn->prepare($q);
	$stmt->execute([  ':groupid' => $request["groupid"] ] );
	$u = $stmt->fetchAll();
	
	$users = array();

	for($i = 0; $i<count($u); $i++){
		$users[] = $u[$i]->userid;
	}

	$result->users = $u;

	return $result;	
}

function doRemoveCouples($request,$conn){
	$result = new \stdClass();

	$q = "DELETE FROM couples WHERE groupid = :groupid";
	$stmt = $conn->prepare($q);
	$stmt->execute([  ':groupid' => $request["groupid"] ] );

	$restult->message = "Couples deleted for group " . $request["groupid"];

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