<?php
	
$conn;


$conffile = parse_ini_file("dm.config");

$DB_NAME = $conffile["DB_NAME"];
$DB_HOST = $conffile["DB_HOST"];
$DB_USER = $conffile["DB_USER"];
$DB_PWD = $conffile["DB_PWD"];

try {
    $conn = new PDO("mysql:host=" . $DB_HOST . ";dbname=" . $DB_NAME , $DB_USER, $DB_PWD);
    // set the PDO error mode to exception
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    // echo "Connected successfully";
    }
catch(PDOException $e)
    {
    // echo "Connection failed: " . $e->getMessage();
    }

?>