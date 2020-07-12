<?php
	
$conn;

$DB_NAME = "DataMeditation";
$DB_HOST = "localhost";
$DB_USER = "dmetidusoo8ei.";
$DB_PWD = "uyids7e93j(6&uuU.;";

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