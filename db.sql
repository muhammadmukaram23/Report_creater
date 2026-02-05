-- Scheme Table
CREATE TABLE scheme (
    gs_no INT PRIMARY KEY,
    sr_no INT,
    name_of_scheme VARCHAR(255),
    physical_progress DECIMAL(5,2),
    total_allocation DECIMAL(12,2),
    funds_released DECIMAL(12,2),
    committed_fund_utilization DECIMAL(12,2),
    labour_deployed INT,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Component Table
CREATE TABLE component (
    comp_id INT AUTO_INCREMENT PRIMARY KEY,
    component_name VARCHAR(255),
    starting_date VARCHAR(255),
    before_image VARCHAR(255), -- Deprecated
    after_image VARCHAR(255),  -- Deprecated
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    gs_no INT,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (gs_no) REFERENCES scheme(gs_no)
);

-- Component Images Table (New)
CREATE TABLE component_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    comp_id INT,
    image_path VARCHAR(255),
    image_type ENUM('before', 'after'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (comp_id) REFERENCES component(comp_id) ON DELETE CASCADE
);
