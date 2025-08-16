<?php
session_start();
if (!isset($_SESSION['user_id'])) {
    header('Location: login.php');
    exit();
}
require 'db.php';
$stmt = $pdo->prepare('SELECT email, user_type FROM users WHERE id = :id');
$stmt->execute([':id' => $_SESSION['user_id']]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$user) {
    session_destroy();
    header('Location: login.php');
    exit();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Profile - Freelancer Hub</title>
    <link rel="stylesheet" href="style.css" />
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
            <li><a href="login.php">Login</a></li>
        </ul>
    </nav>
    <a href="register.php" class="cta btn">Register</a>
</header>
<main style="max-width:800px;margin:2rem auto;padding:0 1rem;">
    <h1>Welcome, <?php echo htmlspecialchars($user['email'], ENT_QUOTES, 'UTF-8'); ?></h1>
    <p>You are logged in as <?php echo htmlspecialchars($user['user_type'], ENT_QUOTES, 'UTF-8'); ?>.</p>
    <p><a href="logout.php">Logout</a></p>
</main>
<footer class="site-footer">
    <div class="contact">
        <p>Contact: <a href="mailto:info@freelancerhub.com">info@freelancerhub.com</a></p>
        <p>
            <a href="https://www.twitter.com/FreelancerHub" target="_blank" aria-label="Twitter">Twitter</a> |
            <a href="https://www.linkedin.com/company/FreelancerHub" target="_blank" aria-label="LinkedIn">LinkedIn</a> |
            <a href="https://www.facebook.com/FreelancerHub" target="_blank" aria-label="Facebook">Facebook</a>
        </p>
    </div>
    <p class="disclaimer">This website is for a class assignment and not for commercial purposes.</p>
</footer>
</body>
</html>
