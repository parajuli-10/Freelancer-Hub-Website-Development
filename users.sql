CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('freelancer','client') NOT NULL
);

CREATE TABLE job_listings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    freelancer_id INT DEFAULT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    skills TEXT,
    location VARCHAR(255),
    job_type VARCHAR(255),
    payment_terms VARCHAR(255),
    status ENUM('open','in_progress','completed') DEFAULT 'open',
    contract_path VARCHAR(255),
    FOREIGN KEY (client_id) REFERENCES users(id),
    FOREIGN KEY (freelancer_id) REFERENCES users(id)
);

CREATE TABLE reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_id INT NOT NULL,
    reviewer_id INT NOT NULL,
    reviewee_id INT NOT NULL,
    rating INT NOT NULL,
    review TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES job_listings(id),
    FOREIGN KEY (reviewer_id) REFERENCES users(id),
    FOREIGN KEY (reviewee_id) REFERENCES users(id)
);
