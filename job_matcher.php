<?php
/**
 * Simple job matching utility.
 * Scores jobs for a freelancer based on skills, location and job type.
 */
function getTopJobMatches($mysqli, array $freelancer, int $limit = 5): array {
    $result = $mysqli->query("SELECT id, title, skills, location, job_type FROM job_listings");
    $matches = [];
    if ($result) {
        $freelancerSkills = array_filter(array_map('trim', explode(',', strtolower($freelancer['skills'] ?? ''))));
        $freelancerLocation = strtolower($freelancer['location'] ?? '');
        $freelancerType = strtolower($freelancer['job_type'] ?? '');
        while ($job = $result->fetch_assoc()) {
            $score = 0;
            $jobSkills = array_filter(array_map('trim', explode(',', strtolower($job['skills'] ?? ''))));
            $skillMatches = array_intersect($freelancerSkills, $jobSkills);
            $score += count($skillMatches) * 10; // weight skills heavily

            $jobLocation = strtolower($job['location'] ?? '');
            if ($freelancerLocation && $jobLocation && ($freelancerLocation === $jobLocation || $jobLocation === 'remote')) {
                $score += 5;
            }

            $jobType = strtolower($job['job_type'] ?? '');
            if ($freelancerType && $jobType && $freelancerType === $jobType) {
                $score += 5;
            }

            if ($score > 0) {
                $job['match_score'] = $score;
                $matches[] = $job;
            }
        }
        usort($matches, fn($a, $b) => $b['match_score'] <=> $a['match_score']);
        $matches = array_slice($matches, 0, $limit);
    }
    return $matches;
}
?>
