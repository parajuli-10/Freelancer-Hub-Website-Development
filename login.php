<?php
session_start();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    $user_type = $_POST['user_type'] ?? 'freelancer';

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        header('Location: login.html');
        exit();
    }

    // Simulate a successful login
    $_SESSION['user_id'] = 1;
    $_SESSION['user_type'] = $user_type;
    header('Location: profile.php');
    exit();
}

header('Location: login.html');
exit();
?>
