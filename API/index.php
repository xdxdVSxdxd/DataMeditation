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

	$stmt->closeCursor();

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
		$q2 = "INSERT INTO users(login,pwd) VALUES( :login , :pwd )";
		$stmt2 = $conn->prepare($q2);
		$stmt2->execute([':login' => $request["login"]  ,   ':pwd' => password_hash($request["password"],PASSWORD_DEFAULT)    ]);

		$result->login = $request["login"];
	    $result->iduser = $conn->lastInsertId();

	} else {
		$result->error = "User already exists.";
	}

	$stmt->closeCursor();

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
		$q2 = "INSERT INTO groups(groupname) VALUES( :groupname )";
		$stmt2 = $conn->prepare($q2);
		$stmt2->execute([':groupname' => $request["groupid"] ]);

		$result->group = $request["groupid"];
	    $result->groupid = $conn->lastInsertId();
	} else {
		$result->group = $request["groupid"];
	    $result->groupid = $group["id"];
	}

	$stmt->closeCursor();

	//find if there is a previous registration of the user in the gorup
	$q = "SELECT lastlogin FROM users_groups WHERE userid=:userid AND groupid=:groupid LIMIT 0,1";
	$stmt = $conn->prepare($q);
	$stmt->execute([':userid' => $request["iduser"] , ':groupid' => $result->groupid ]);
	$signin = $stmt->fetch();

	if($signin || $signin!=NULL){
		// if there is --> update it
		$q2 = "UPDATE users_groups SET lastlogin=NOW() WHERE userid=:userid AND groupid=:groupid";
		$stmt2 = $conn->prepare($q2);
		$stmt2->execute([':userid' => $request["iduser"] , ':groupid' => $result->groupid ]);

	} else {
		// if there is not --> insert it
		$q2 = "INSERT INTO users_groups(userid,groupid,lastlogin) VALUES(:userid,:groupid, NOW() )";
		$stmt2 = $conn->prepare($q2);
		$stmt2->execute([':userid' => $request["iduser"] , ':groupid' => $result->groupid ]);


	}

	$stmt->closeCursor();


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

	$stmt->closeCursor();

	return $result;	
}

function doStoreData($request,$conn){
	$result = new \stdClass();

	$q = "INSERT INTO jsondata(userid,groupid,timestamp,jsonstring,year,month,day,hour,minute,second) VALUES(:userid,:groupid, NOW(), :data , :year , :month , :day , :hour , :minute, :second )";
	$stmt = $conn->prepare($q);
	$stmt->execute([':userid' => $request["userid"] , ':groupid' => $request["groupid"] , ":data" => $request["jsondata"]   ,  ":year" => $request["year"] , ":month" => $request["month"] , ":day" => $request["day"] , ":hour" => $request["hour"] , ":minute" => $request["minute"] , ":second" => $request["second"] ] );

	return $result;	
}

function doInWaitingRoom($request,$conn){
	$result = new \stdClass();

	//$restult->error = "in waiting room";

	// communicate that the user logged into the ritual's waiting room
	// cmd=inwaitingroom&userid=x&groupid=y&recentness=z) 
	// --> returns array of users in group with 0=absent, 1=present , 2=doing ritual , 3=ended ritual

	// update my status in the waitingroom
	$userid = $request["userid"];
	$groupid = $request["groupid"];
	$recentness = $request["recentness"];
	$q1 = "SELECT id,status FROM access_to_ritual WHERE iduser = :userid AND groupid = :groupid ORDER BY t DESC LIMIT 0,1";
	$stmt1 = $conn->prepare($q1);
	$stmt1->execute([':userid' => $userid , ':groupid' => $groupid  ] );
	if( $r1 = $stmt1->fetch() ){
		$idrow = $r1["id"];
		$status = $r1["status"];

		$q2 = "UPDATE access_to_ritual SET status=1 , t = NOW() WHERE iduser = :userid AND groupid = :groupid";
		$stmt2 = $conn->prepare($q2);
		$stmt2->execute([':userid' => $userid , ':groupid' => $groupid  ] );

	} else {
		
		$q2 = "INSERT INTO access_to_ritual(iduser,groupid,t,status) VALUES ( :userid , :groupid, NOW() , 1 )";
		$stmt2 = $conn->prepare($q2);
		$stmt2->execute([':userid' => $userid , ':groupid' => $groupid  ] );

	}
	$stmt1->closeCursor();

	// get all users in group from users_groups and mark them with status = 0
	$ug = array();
	
	$q2 = "SELECT u.id as id, u.login as login, ug.lastlogin as lastlogin FROM users u , users_groups ug WHERE ug.groupid = :groupid AND u.id=ug.userid";
	$stmt2 = $conn->prepare($q2);
	$stmt2->execute([':groupid' => $groupid  ] );

	while($r2 = $stmt2->fetch()){
		$uu = new \stdClass();
		$uu->id = $r2["id"];
		$uu->login = $r2["login"];
		$uu->lastlogin = $r2["lastlogin"];
		$uu->status = 0;

		$ug[] = $uu;
	}

	$stmt2->closeCursor();

	// get all elements from today from access_to_ritual where timestamp is more recent than "recentness" minutes, and mark them as "present-->1" in status
	$q2 = "SELECT iduser FROM access_to_ritual WHERE groupid = :groupid AND t > NOW() - INTERVAL " . $recentness . " MINUTE";
	$stmt2 = $conn->prepare($q2);
	$stmt2->execute([':groupid' => $groupid  ] );

	while($r2 = $stmt2->fetch()){
		$idtoupdate = $r2["iduser"];
		for($i=0; $i<count($ug); $i++){
			if($idtoupdate==$ug[$i]->id){
				$ug[$i]->status = 1;
			}
		}
	}

	$stmt2->closeCursor();

	// get all elements from today from access_to_ritual where status = 2 o 3, and mark them accordingly on status

	$q2 = "SELECT iduser,status FROM access_to_ritual WHERE groupid = :groupid AND ( status = 2 OR status = 3  ) ";
	$stmt2 = $conn->prepare($q2);
	$stmt2->execute([':groupid' => $groupid  ] );

	while($r2 = $stmt2->fetch()){
		$idtoupdate = $r2["iduser"];
		for($i=0; $i<count($ug); $i++){
			if($idtoupdate==$ug[$i]->id){
				$ug[$i]->status = $r2["status"];
			}
		}
	}

	$stmt2->closeCursor();


	// return result

	$result->usersingroup = $ug;

	return $result;	
}

function doJoinRitual($request,$conn){
	$result = new \stdClass();

	return $result;	
}

function doGetMyCouple($request,$conn){
	$result = new \stdClass();

	$q = "SELECT * FROM couples WHERE groupid = :groupid AND ( iduser1 = :id1 OR iduser2 = :id2 )";
	$stmt = $conn->prepare($q);
	$stmt->execute([  ':groupid' => $request["groupid"]   ,    ':id1' => $request["userid"]     ,   ':id2' => $request["userid"]     ] );

	$result->couples = array();

	while($r = $stmt->fetch()){
		$result->couples[]	 = $r;	
	}

	$stmt->closeCursor();

	return $result;	
}

function doGetMyCoupleDataForRitual($request,$conn){
	$result = new \stdClass();

	// set status = 2 in access_to_ritual

	$userid = $request["userid"];
	$groupid = $request["groupid"];

	$year = $request["year"];
	$month = $request["month"];
	$day = $request["day"];

	$fromdate = $year . '-' . $month . '-' . $day . ' 00:00:01';
	$todate = $year . '-' . $month . '-' . $day . ' 23:59:59';

	$q2 = "UPDATE access_to_ritual SET status=2 , t = NOW() WHERE iduser = :userid AND groupid = :groupid";
	$stmt2 = $conn->prepare($q2);
	$stmt2->execute([':userid' => $userid , ':groupid' => $groupid  ] );

	// trovare il mio altro
	$q2 = "SELECT iduser1,iduser2 FROM couples WHERE groupid = :groupid AND ( iduser1 = :iduser1 OR iduser2 = :iduser2 ) LIMIT 0,1";
	$stmt2 = $conn->prepare($q2);
	$stmt2->execute([':groupid' => $groupid  ,   ':iduser1' => $userid   ,  ':iduser2' => $userid  ] );
	$theotherid = $userid;
	if( $r1 = $stmt2->fetch() ){
		if($r1["iduser1"]!=$userid){
			$theotherid = $r1["iduser1"];
		} else {
			$theotherid = $r1["iduser1"];
		}
	}
	$stmt2->closeCursor();

	// pescare i dati
	$q2 = "SELECT jsonstring,userid,hour,minute,second FROM jsondata WHERE groupid = :groupid AND ( userid = :iduser  OR  userid = :otherid ) AND year = :year AND month = :month AND day = :day ORDER BY hour ASC, minute ASC, second ASC";
	$stmt2 = $conn->prepare($q2);
	$stmt2->execute([':groupid' => $groupid  ,   ':iduser' => $userid  ,   ':otherid' => $theotherid ,  ':year' => $year   ,  ':month' => $month   ,  ':day' => $day  ] );
	$theData = new \stdClass();
	$theData->myData = array();
	$theData->theOthersData = array();
	while( $r1 = $stmt2->fetch() ){
		$o = new \stdClass();
		$o->jsonstring = $r1["jsonstring"];
		$o->userid = $r1["userid"];
		$o->hour = $r1["hour"];
		$o->minute = $r1["minute"];
		$o->second = $r1["second"];
		if($o->userid==$userid){
			$theData->myData[] = $o;
		} else {
			$theData->theOthersData[] = $o;
		}
	}
	$stmt2->closeCursor();

	// restituire
	$result->theData = $theData;

	return $result;	
}

function doListUsersInGroups($request,$conn){
	$result = new \stdClass();

	return $result;	
}

function doEndRitualStatus($request,$conn){
	$result = new \stdClass();

	return $result;	
}

function doCreateCouples($request,$conn){
	$result = new \stdClass();

	doRemoveCouples($request,$conn);

	$q = "SELECT distinct userid FROM users_groups WHERE groupid = :groupid";
	$stmt = $conn->prepare($q);
	$stmt->execute([  ':groupid' => $request["groupid"] ] );
	$users = array();

	while($u = $stmt->fetch()){
		$users[] = $u["userid"];
	}

	$stmt->closeCursor();

	// shuffle vector
	shuffle($users);

	// take two-by-two
	// form couples and chaturl
	// what to do with odd?

	if(count($users)%2!=0){
		$ra = $users[ array_rand($users) ];
		$users[] = $ra;
	}

	for($i = 0; $i<count($users); $i = $i + 2){
		$i1 = $users[$i];
		$i2 = $users[$i+1];
		$link = $request["link"] . uniqid() . "_" . $i;
		$q = "INSERT INTO couples(groupid , iduser1 , iduser2 , linktochat ) VALUES (  :groupid , :iduser1 , :iduser2  , :link )";
		$stmt = $conn->prepare($q);
		$stmt->execute([  ':groupid' => $request["groupid"]  ,   ':iduser1' => $i1    ,    ':iduser2' => $i2 ,    ':link' => $link     ] );
	}

	//$result->users = $users;

	$q = "SELECT * FROM couples WHERE groupid = :groupid";
	$stmt = $conn->prepare($q);
	$stmt->execute([  ':groupid' => $request["groupid"]  ] );

	$result->couples = array();

	while($r = $stmt->fetch()){
		$result->couples[]	 = $r;	
	}

	$stmt->closeCursor();

	return $result;	
}

function doRemoveCouples($request,$conn){
	$result = new \stdClass();

	$q = "DELETE FROM couples WHERE groupid = :groupid";
	$stmt = $conn->prepare($q);
	$stmt->execute([  ':groupid' => $request["groupid"] ] );

	$msg = "Couples deleted for group " . $request["groupid"];
	$result->message = $msg;

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
} else if($cmd=="inwaitingroom"){
	$result = doInWaitingRoom($_REQUEST,$conn);
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