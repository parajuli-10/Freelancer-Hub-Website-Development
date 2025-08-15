<?php
session_start();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    $confirm = $_POST['confirm_password'] ?? '';
    $user_type = $_POST['user_type'] ?? 'freelancer';

    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $password !== $confirm) {
        header('Location: register.html');
        exit();
    }

    // Simulate user being logged in after registration
    $_SESSION['user_id'] = 1;
    $_SESSION['user_type'] = $user_type;
    header('Location: profile.php');
    exit();
}

header('Location: register.html');
exit();
?>
