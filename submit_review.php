<?php
session_start();
require 'db.php';

if (!isset($_SESSION['user_id']) || !isset($_SESSION['user_type'])) {
    header('Location: login.php');
    exit();
}

$user_id = (int)$_SESSION['user_id'];
$job_id = (int)($_GET['job_id'] ?? 0);
if ($job_id <= 0) {
    die('Invalid job');
}

$stmt = $mysqli->prepare('SELECT client_id, freelancer_id FROM job_listings WHERE id=?');
$stmt->bind_param('i', $job_id);
$stmt->execute();
$stmt->bind_result($client_id, $freelancer_id);
$stmt->fetch();
$stmt->close();

if (!$client_id) {
    die('Job not found');
}

if ($user_id === (int)$client_id) {
    $reviewee_id = (int)$freelancer_id;
} elseif ($user_id === (int)$freelancer_id) {
    $reviewee_id = (int)$client_id;
} else {
    die('You are not part of this job');
}

$success = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $rating = (int)($_POST['rating'] ?? 0);
    $review = trim($_POST['review'] ?? '');
    if ($rating >= 1 && $rating <= 5) {
        $stmt = $mysqli->prepare('INSERT INTO reviews (job_id, reviewer_id, reviewee_id, rating, review) VALUES (?,?,?,?,?)');
        $stmt->bind_param('iiiis', $job_id, $user_id, $reviewee_id, $rating, $review);
        $stmt->execute();
        $stmt->close();
        $success = 'Review submitted successfully';
    } else {
        $success = 'Invalid rating value';
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="style.css">
    <title>Leave a Review</title>
</head>
<body>
<header class="site-header">
    <div class="logo">Freelancer Hub</div>
</header>
<div class="form-container">
    <h2>Leave a Review</h2>
    <?php if ($success): ?>
        <p><?php echo htmlspecialchars($success); ?></p>
    <?php endif; ?>
    <form method="post">
        <label>Rating:
            <select name="rating">
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
            </select>
        </label>
        <label>Review:
            <textarea name="review" rows="4"></textarea>
        </label>
        <button type="submit" class="save-btn">Submit</button>
    </form>
</div>
</body>
</html>
