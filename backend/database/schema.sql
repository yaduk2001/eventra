-- Eventrra Database Schema
-- Comprehensive event management marketplace platform

-- Users table (extends Firebase Auth)
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY, -- Firebase UID
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    picture TEXT,
    phone VARCHAR(20),
    role ENUM('customer', 'event_company', 'caterer', 'transport', 'photographer', 'freelancer', 'jobseeker', 'admin') NOT NULL,
    approved BOOLEAN DEFAULT FALSE,
    business_name VARCHAR(255),
    business_license VARCHAR(255),
    location VARCHAR(255),
    service_areas JSON,
    categories JSON,
    skills JSON,
    specialties JSON,
    food_packages JSON,
    rental_items JSON,
    vehicles JSON,
    packages JSON,
    availability JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_role (role),
    INDEX idx_approved (approved),
    INDEX idx_location (location)
);

-- Events table
CREATE TABLE events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type ENUM('wedding', 'birthday', 'corporate', 'anniversary', 'graduation', 'other') NOT NULL,
    event_date DATE NOT NULL,
    event_time TIME,
    location VARCHAR(255) NOT NULL,
    guest_count INT,
    budget DECIMAL(10,2),
    status ENUM('draft', 'published', 'completed', 'cancelled') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_event_type (event_type),
    INDEX idx_event_date (event_date),
    INDEX idx_location (location),
    INDEX idx_status (status)
);

-- Service Providers table (detailed provider information)
CREATE TABLE service_providers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    description TEXT,
    address TEXT,
    service_areas JSON,
    categories JSON,
    business_license VARCHAR(255),
    rating DECIMAL(3,2) DEFAULT 0.00,
    review_count INT DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_business_name (business_name),
    INDEX idx_rating (rating),
    INDEX idx_is_verified (is_verified),
    INDEX idx_is_featured (is_featured)
);

-- Bid Requests table
CREATE TABLE bid_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    event_id INT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type ENUM('wedding', 'birthday', 'corporate', 'anniversary', 'graduation', 'other') NOT NULL,
    event_date DATE NOT NULL,
    location VARCHAR(255) NOT NULL,
    guest_count INT,
    budget DECIMAL(10,2),
    requirements TEXT,
    status ENUM('open', 'closed', 'awarded', 'cancelled') DEFAULT 'open',
    deadline DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL,
    INDEX idx_event_type (event_type),
    INDEX idx_event_date (event_date),
    INDEX idx_status (status),
    INDEX idx_deadline (deadline)
);

-- Bids table
CREATE TABLE bids (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bid_request_id INT NOT NULL,
    provider_id VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    timeline VARCHAR(255),
    terms TEXT,
    status ENUM('pending', 'accepted', 'rejected', 'withdrawn') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (bid_request_id) REFERENCES bid_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_bid_request_id (bid_request_id),
    INDEX idx_provider_id (provider_id),
    INDEX idx_status (status)
);

-- Bookings table
CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    provider_id VARCHAR(255) NOT NULL,
    event_id INT,
    bid_id INT,
    service_type ENUM('event_management', 'catering', 'transport', 'photography', 'freelancer') NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    location VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL,
    FOREIGN KEY (bid_id) REFERENCES bids(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_provider_id (provider_id),
    INDEX idx_service_type (service_type),
    INDEX idx_status (status),
    INDEX idx_event_date (event_date)
);

-- Portfolio table (for service providers)
CREATE TABLE portfolio (
    id INT AUTO_INCREMENT PRIMARY KEY,
    provider_id VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    media_type ENUM('image', 'video') NOT NULL,
    media_url TEXT NOT NULL,
    category VARCHAR(100),
    tags JSON,
    likes_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_provider_id (provider_id),
    INDEX idx_media_type (media_type),
    INDEX idx_category (category),
    INDEX idx_is_featured (is_featured)
);

-- Portfolio Comments table
CREATE TABLE portfolio_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    portfolio_id INT NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (portfolio_id) REFERENCES portfolio(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_portfolio_id (portfolio_id),
    INDEX idx_user_id (user_id)
);

-- Portfolio Likes table
CREATE TABLE portfolio_likes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    portfolio_id INT NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (portfolio_id) REFERENCES portfolio(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_like (portfolio_id, user_id),
    INDEX idx_portfolio_id (portfolio_id),
    INDEX idx_user_id (user_id)
);

-- Notifications table
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('booking', 'bid', 'approval', 'system', 'payment') NOT NULL,
    related_id INT, -- ID of related booking, bid, etc.
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
);

-- Reviews table
CREATE TABLE reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    reviewer_id VARCHAR(255) NOT NULL,
    reviewee_id VARCHAR(255) NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewee_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_review (booking_id, reviewer_id),
    INDEX idx_reviewee_id (reviewee_id),
    INDEX idx_rating (rating)
);

-- Payments table (placeholder for future payment integration)
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    payment_method VARCHAR(50),
    transaction_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    INDEX idx_booking_id (booking_id),
    INDEX idx_status (status)
);

-- Categories table
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Service Areas table
CREATE TABLE service_areas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_state (state),
    INDEX idx_country (country)
);

-- Insert default categories
INSERT INTO categories (name, description, icon) VALUES
('Wedding', 'Wedding planning and coordination', '💒'),
('Birthday', 'Birthday parties and celebrations', '🎂'),
('Corporate', 'Corporate events and meetings', '🏢'),
('Anniversary', 'Anniversary celebrations', '💍'),
('Graduation', 'Graduation ceremonies', '🎓'),
('Festival', 'Religious and cultural festivals', '🎊'),
('Sports', 'Sports events and tournaments', '⚽'),
('Conference', 'Conferences and seminars', '🎤');

-- Insert default service areas
INSERT INTO service_areas (name, state, country) VALUES
('Mumbai', 'Maharashtra', 'India'),
('Delhi', 'Delhi', 'India'),
('Bangalore', 'Karnataka', 'India'),
('Chennai', 'Tamil Nadu', 'India'),
('Kolkata', 'West Bengal', 'India'),
('Hyderabad', 'Telangana', 'India'),
('Pune', 'Maharashtra', 'India'),
('Ahmedabad', 'Gujarat', 'India'),
('Jaipur', 'Rajasthan', 'India'),
('Lucknow', 'Uttar Pradesh', 'India');
