<?php
$mysqli = new mysqli('localhost', 'username', 'password', 'freelancer_hub');
if ($mysqli->connect_errno) {
    die('Failed to connect to MySQL: ' . $mysqli->connect_error);
}
?>
