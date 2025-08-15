<?php
session_start();

// Basic registration without database interaction
$errors = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    $confirm = $_POST['confirm_password'] ?? '';

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors[] = 'Invalid email address';
    }

    if ($password !== $confirm) {
        $errors[] = 'Passwords do not match';
    }

    if (!$errors) {
        // Simulate user being logged in after registration
        $_SESSION['user_id'] = 1;
        header('Location: profile.php');
        exit();
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="style.css">
    <title>Register</title>
</head>
<body>
<header class="site-header">
    <div class="logo">Freelancer Hub</div>
</header>
<div class="form-container">
    <?php foreach ($errors as $error): ?>
        <p class="error"><?php echo htmlspecialchars($error); ?></p>
    <?php endforeach; ?>
    <form method="post" action="">
        <label>Email: <input type="email" name="email" required></label>
        <label>Password: <input type="password" name="password" required></label>
        <label>Confirm Password: <input type="password" name="confirm_password" required></label>
        <button type="submit">Register</button>
    </form>
    <p>Already have an account? <a href="login.php">Login here</a></p>
</div>
</body>
</html>
