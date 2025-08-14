<?php
require_once 'db.php';
require_once 'lib/fpdf.php';

// Automatically generate contracts for completed jobs without a contract
$jobs = $mysqli->query("SELECT jl.id, jl.title, jl.description, jl.payment_terms, jl.client_id, jl.freelancer_id, u1.name AS client_name, u2.name AS freelancer_name FROM job_listings jl JOIN users u1 ON jl.client_id = u1.id JOIN users u2 ON jl.freelancer_id = u2.id WHERE jl.status = 'completed' AND (jl.contract_path IS NULL OR jl.contract_path = '')");

if ($jobs) {
    if (!is_dir('contracts')) {
        mkdir('contracts', 0777, true);
    }
    while ($job = $jobs->fetch_assoc()) {
        $pdf = new FPDF();
        $pdf->AddPage();
        $pdf->SetFont('Arial', 'B', 16);
        $pdf->Cell(0, 10, 'Freelancer Hub Contract', 0, 1, 'C');
        $pdf->Ln(5);
        $pdf->SetFont('Arial', '', 12);
        $pdf->MultiCell(0, 8, 'Freelancer: ' . $job['freelancer_name']);
        $pdf->MultiCell(0, 8, 'Client: ' . $job['client_name']);
        $pdf->MultiCell(0, 8, 'Job Title: ' . $job['title']);
        $pdf->MultiCell(0, 8, 'Job Description: ' . $job['description']);
        $pdf->MultiCell(0, 8, 'Payment Terms: ' . $job['payment_terms']);
        $pdf->Ln(10);
        $pdf->Cell(0, 8, 'Freelancer Approval: [ ]', 0, 1);
        $pdf->Cell(0, 8, 'Client Approval: [ ]', 0, 1);
        $filename = 'contracts/contract_job_' . $job['id'] . '.pdf';
        $pdf->Output('F', $filename);
        $stmt = $mysqli->prepare("UPDATE job_listings SET contract_path = ? WHERE id = ?");
        $stmt->bind_param('si', $filename, $job['id']);
        $stmt->execute();
        $stmt->close();
    }
}
?>
