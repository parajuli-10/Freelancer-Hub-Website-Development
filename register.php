<?php
session_start();
require 'db.php';

if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

$errors = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_POST['csrf_token']) || !hash_equals($_SESSION['csrf_token'], $_POST['csrf_token'])) {
        $errors[] = 'Invalid CSRF token';
    }

    $name = trim($_POST['name'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    $role = $_POST['role'] ?? '';

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors[] = 'Invalid email address';
    }

    if (!preg_match('/^(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{8,}$/', $password)) {
        $errors[] = 'Password must be at least 8 characters long and include a number and a symbol';
    }

    if ($role !== 'freelancer' && $role !== 'client') {
        $errors[] = 'Invalid role selected';
    }

    if (!$errors) {
        $stmt = $mysqli->prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)');
        $hash = password_hash($password, PASSWORD_DEFAULT);
        $stmt->bind_param('ssss', $name, $email, $hash, $role);
        if ($stmt->execute()) {
            header('Location: login.php');
            exit();
        } else {
            $errors[] = 'Registration failed';
        }
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
        <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars($_SESSION['csrf_token']); ?>">
        <label>Name: <input type="text" name="name" required></label>
        <label>Email: <input type="email" name="email" required></label>
        <label>Password: <input type="password" name="password" required></label>
        <label>Role:
            <select name="role">
                <option value="freelancer">Freelancer</option>
                <option value="client">Client</option>
            </select>
        </label>
        <button type="submit">Register</button>
    </form>
    <p>Already have an account? <a href="login.php">Login here</a></p>
</div>
</body>
</html>
