<?php
session_start();

if (!isset($_SESSION['user_id']) || !isset($_SESSION['user_type'])) {
    header('Location: login.html');
    exit();
}

$mysqli = new mysqli('localhost', 'username', 'password', 'freelancer_hub');
if ($mysqli->connect_errno) {
    die('Failed to connect to MySQL: ' . $mysqli->connect_error);
}

$user_id = (int)$_SESSION['user_id'];
$user_type = $_SESSION['user_type'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if ($user_type === 'freelancer') {
        $bio = $mysqli->real_escape_string($_POST['bio'] ?? '');
        $skills = $mysqli->real_escape_string($_POST['skills'] ?? '');
        $experience = $mysqli->real_escape_string($_POST['experience'] ?? '');
        $portfolio = $mysqli->real_escape_string($_POST['portfolio'] ?? '');
        $location = $mysqli->real_escape_string($_POST['location'] ?? '');
        $job_type = $mysqli->real_escape_string($_POST['job_type'] ?? '');

        if (isset($_FILES['profile_pic']) && $_FILES['profile_pic']['error'] === UPLOAD_ERR_OK) {
            $upload_dir = 'uploads/';
            if (!is_dir($upload_dir)) {
                mkdir($upload_dir, 0777, true);
            }
            $filename = $user_id . '_' . basename($_FILES['profile_pic']['name']);
            move_uploaded_file($_FILES['profile_pic']['tmp_name'], $upload_dir . $filename);
            $profile_pic = $mysqli->real_escape_string($upload_dir . $filename);
            $mysqli->query("UPDATE freelancers SET profile_pic='$profile_pic' WHERE id=$user_id");
        }

        $mysqli->query("UPDATE freelancers SET bio='$bio', skills='$skills', experience='$experience', portfolio='$portfolio', location='$location', job_type='$job_type' WHERE id=$user_id");
    } else {
        $company = $mysqli->real_escape_string($_POST['company'] ?? '');
        $contact = $mysqli->real_escape_string($_POST['contact'] ?? '');
        $mysqli->query("UPDATE clients SET company_name='$company', contact_info='$contact' WHERE id=$user_id");
    }
}

if ($user_type === 'freelancer') {
    $result = $mysqli->query("SELECT profile_pic, bio, skills, experience, portfolio, location, job_type FROM freelancers WHERE id=$user_id");
    $user = $result ? $result->fetch_assoc() : [];
    require_once 'job_matcher.php';
    $top_matches = getTopJobMatches($mysqli, $user);
} else {
    $result = $mysqli->query("SELECT company_name, contact_info FROM clients WHERE id=$user_id");
    $user = $result ? $result->fetch_assoc() : [];
    $jobs = $mysqli->query("SELECT title FROM job_listings WHERE client_id=$user_id");
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="style.css">
    <title>User Profile</title>
</head>
<body>
<header class="site-header">
    <div class="logo">Freelancer Hub</div>
    <nav class="navigation">
        <ul>
            <li><a href="index.html">Home</a></li>
            <li><a href="job-listings.html">Jobs</a></li>
        </ul>
    </nav>
    <a href="logout.php" class="cta logout-btn">Logout</a>
</header>

<div class="profile-container">
    <aside class="profile-sidebar">
        <?php if ($user_type === 'freelancer'): ?>
            <img src="<?php echo htmlspecialchars($user['profile_pic'] ?? 'default-avatar.png'); ?>" class="profile-image" alt="Profile Picture">
            <form method="POST" enctype="multipart/form-data">
                <input type="file" name="profile_pic">
                <button type="submit" class="save-btn">Upload</button>
            </form>
        <?php else: ?>
            <h2><?php echo htmlspecialchars($user['company_name'] ?? ''); ?></h2>
        <?php endif; ?>
    </aside>

    <section class="profile-content">
        <?php if ($user_type === 'freelancer'): ?>
            <form method="POST" enctype="multipart/form-data" class="profile-form">
                <section>
                    <h2>Bio</h2>
                    <textarea name="bio" rows="4"><?php echo htmlspecialchars($user['bio'] ?? ''); ?></textarea>
                </section>
                <section>
                    <h2>Skills</h2>
                    <input type="text" name="skills" value="<?php echo htmlspecialchars($user['skills'] ?? ''); ?>">
                </section>
                <section>
                    <h2>Location</h2>
                    <input type="text" name="location" value="<?php echo htmlspecialchars($user['location'] ?? ''); ?>">
                </section>
                <section>
                    <h2>Preferred Job Type</h2>
                    <input type="text" name="job_type" value="<?php echo htmlspecialchars($user['job_type'] ?? ''); ?>">
                </section>
                <section>
                    <h2>Experience</h2>
                    <textarea name="experience" rows="4"><?php echo htmlspecialchars($user['experience'] ?? ''); ?></textarea>
                </section>
                <section>
                    <h2>Portfolio</h2>
                    <textarea name="portfolio" rows="4"><?php echo htmlspecialchars($user['portfolio'] ?? ''); ?></textarea>
                </section>
                <button type="submit" class="save-btn">Save Profile</button>
            </form>
            <section>
                <h2>Recommended Jobs</h2>
                <ul class="job-list">
                <?php if (!empty($top_matches)): foreach ($top_matches as $match): ?>
                    <li>
                        <strong><?php echo htmlspecialchars($match['title']); ?></strong><br>
                        <span>Skills Needed: <?php echo htmlspecialchars($match['skills']); ?></span><br>
                        <span>Match Score: <?php echo (int)$match['match_score']; ?></span>
                    </li>
                <?php endforeach; else: ?>
                    <li>No matching jobs found.</li>
                <?php endif; ?>
                </ul>
            </section>
            <section>
                <h2>Your Contracts</h2>
                <ul class="job-list">
                <?php
                    $contracts = $mysqli->query("SELECT title, contract_path FROM job_listings WHERE freelancer_id=$user_id AND contract_path IS NOT NULL");
                    if ($contracts && $contracts->num_rows > 0):
                        while ($contract = $contracts->fetch_assoc()): ?>
                        <li><a href="<?php echo htmlspecialchars($contract['contract_path']); ?>" download>Download contract for <?php echo htmlspecialchars($contract['title']); ?></a></li>
                    <?php endwhile; else: ?>
                        <li>No contracts available.</li>
                    <?php endif; ?>
                </ul>
            </section>
        <?php else: ?>
            <form method="POST" class="profile-form">
                <section>
                    <h2>Company Name</h2>
                    <input type="text" name="company" value="<?php echo htmlspecialchars($user['company_name'] ?? ''); ?>">
                </section>
                <section>
                    <h2>Contact Information</h2>
                    <textarea name="contact" rows="4"><?php echo htmlspecialchars($user['contact_info'] ?? ''); ?></textarea>
                </section>
                <button type="submit" class="save-btn">Save Profile</button>
            </form>
            <section>
                <h2>Your Job Listings</h2>
                <ul class="job-list">
                <?php if (isset($jobs) && $jobs && $jobs->num_rows > 0): while ($job = $jobs->fetch_assoc()): ?>
                    <li><?php echo htmlspecialchars($job['title']); ?></li>
                <?php endwhile; else: ?>
                    <li>No job listings yet.</li>
                <?php endif; ?>
                </ul>
            </section>
            <section>
                <h2>Contracts</h2>
                <ul class="job-list">
                <?php
                    $contracts = $mysqli->query("SELECT title, contract_path FROM job_listings WHERE client_id=$user_id AND contract_path IS NOT NULL");
                    if ($contracts && $contracts->num_rows > 0):
                        while ($contract = $contracts->fetch_assoc()): ?>
                        <li><a href="<?php echo htmlspecialchars($contract['contract_path']); ?>" download>Download contract for <?php echo htmlspecialchars($contract['title']); ?></a></li>
                    <?php endwhile; else: ?>
                        <li>No contracts available.</li>
                    <?php endif; ?>
                </ul>
            </section>
        <?php endif; ?>
    </section>
</div>
</body>
</html>
