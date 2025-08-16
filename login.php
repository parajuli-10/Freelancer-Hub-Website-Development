<?php
session_start();
require 'db.php';
$errors = [];
$email = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_POST['_token']) || !hash_equals($_SESSION['_token'] ?? '', $_POST['_token'])) {
        $errors[] = 'Invalid CSRF token.';
    }
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    $user_type = $_POST['user_type'] ?? 'freelancer';
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors[] = 'Please enter a valid email address.';
    }
    if ($password === '') {
        $errors[] = 'Password is required.';
    }
    if (!$errors) {
        $stmt = $pdo->prepare('SELECT id, password, user_type FROM users WHERE email = :email');
        $stmt->execute([':email' => $email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($user && password_verify($password, $user['password'])) {
            session_regenerate_id(true);
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['email'] = $email;
            $_SESSION['user_type'] = $user['user_type'];
            unset($_SESSION['_token']);
            header('Location: profile.php');
            exit();
        } else {
            $errors[] = 'Invalid email or password.';
        }
    }
}
if (empty($_SESSION['_token'])) {
    $_SESSION['_token'] = bin2hex(random_bytes(32));
}
$token = $_SESSION['_token'];
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Login - Freelancer Hub</title>
    <link rel="stylesheet" href="style.css"/>
</head>
<body>
<header class="site-header">
    <div class="logo">Freelancer Hub</div>
    <nav class="navigation">
        <ul>
            <li><a href="index.php">Home</a></li>
            <li><a href="about.php">About Us</a></li>
            <li><a href="job-listings.php">Job Listings</a></li>
            <li><a href="contact.php">Contact Us</a></li>
            <li><a href="login.php" aria-current="page">Login</a></li>
        </ul>
    </nav>
    <a href="register.php" class="cta btn">Register</a>
</header>
<main>
    <section style="max-width:480px;margin:2rem auto;padding:0 1rem;">
        <h1>Login</h1>
        <?php if ($errors): ?>
            <div class="error-list" role="alert" aria-live="polite" style="margin:.75rem 0;">
                <?php foreach ($errors as $error): ?>
                    <p class="error"><?php echo htmlspecialchars($error, ENT_QUOTES, 'UTF-8'); ?></p>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
        <form method="post" action="login.php" class="form" novalidate>
            <input type="hidden" name="_token" value="<?php echo htmlspecialchars($token, ENT_QUOTES, 'UTF-8'); ?>">
            <label for="email">Email</label>
            <input id="email" name="email" type="email" value="<?php echo htmlspecialchars($email, ENT_QUOTES, 'UTF-8'); ?>" required>
            <label for="password">Password</label>
            <input id="password" name="password" type="password" required>
            <fieldset style="margin:.75rem 0;">
                <legend>User Type</legend>
                <label><input type="radio" name="user_type" value="freelancer" <?php echo ($user_type ?? '') === 'client' ? '' : 'checked'; ?>> Freelancer</label>
                <label><input type="radio" name="user_type" value="client" <?php echo ($user_type ?? '') === 'client' ? 'checked' : ''; ?>> Client</label>
            </fieldset>
            <button type="submit" class="btn">Login</button>
        </form>
        <p style="margin-top:1rem;">Don't have an account? <a href="register.php">Register</a></p>
    </section>
</main>
<footer class="site-footer">
    <div class="contact">
        <p>Contact: <a href="mailto:info@freelancerhub.com">info@freelancerhub.com</a></p>
        <p>
            <a href="https://www.twitter.com/FreelancerHub" target="_blank" rel="noopener" aria-label="Twitter">Twitter</a> |
            <a href="https://www.linkedin.com/company/FreelancerHub" target="_blank" rel="noopener" aria-label="LinkedIn">LinkedIn</a> |
            <a href="https://www.facebook.com/FreelancerHub" target="_blank" rel="noopener" aria-label="Facebook">Facebook</a>
        </p>
    </div>
    <p class="disclaimer">This website is for a class assignment and not for commercial purposes.</p>
</footer>
</body>
</html>
