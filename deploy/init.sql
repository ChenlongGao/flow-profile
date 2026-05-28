# ==========================================
# 客流诊断预警系统 - MySQL 初始化
# ==========================================

CREATE DATABASE IF NOT EXISTS flow_warning CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE flow_warning;

-- 品牌
CREATE TABLE IF NOT EXISTS brands (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 城市
CREATE TABLE IF NOT EXISTS cities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    province VARCHAR(100) DEFAULT '',
    UNIQUE KEY uk_city (name, province)
) ENGINE=InnoDB;

-- 商圈
CREATE TABLE IF NOT EXISTS business_districts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    city_id INT NOT NULL,
    area_name VARCHAR(200) DEFAULT '',
    FOREIGN KEY (city_id) REFERENCES cities(id),
    UNIQUE KEY uk_district (name, city_id)
) ENGINE=InnoDB;

-- 商场
CREATE TABLE IF NOT EXISTS malls (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mall_id VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    city_id INT NOT NULL,
    district_id INT,
    status VARCHAR(20) DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (city_id) REFERENCES cities(id),
    FOREIGN KEY (district_id) REFERENCES business_districts(id)
) ENGINE=InnoDB;

-- 门店
CREATE TABLE IF NOT EXISTS stores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    store_id VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    brand_id INT NOT NULL,
    mall_id INT NOT NULL,
    city_id INT NOT NULL,
    district_id INT,
    status VARCHAR(20) DEFAULT 'open',
    opened_at DATE,
    area_sqm DECIMAL(10,2),
    business_type VARCHAR(100) DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (brand_id) REFERENCES brands(id),
    FOREIGN KEY (mall_id) REFERENCES malls(id),
    FOREIGN KEY (city_id) REFERENCES cities(id),
    FOREIGN KEY (district_id) REFERENCES business_districts(id)
) ENGINE=InnoDB;

-- 商场客流数据
CREATE TABLE IF NOT EXISTS mall_flow_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mall_id VARCHAR(100) NOT NULL,
    data_date DATE NOT NULL,
    visitor_count INT NOT NULL DEFAULT 0,
    visitor_people INT NOT NULL DEFAULT 0,
    avg_stay_minutes DECIMAL(8,2) DEFAULT 0,
    male_ratio DECIMAL(8,4) DEFAULT 0,
    female_ratio DECIMAL(8,4) DEFAULT 0,
    age_18_24_ratio DECIMAL(8,4) DEFAULT 0,
    age_25_34_ratio DECIMAL(8,4) DEFAULT 0,
    age_35_44_ratio DECIMAL(8,4) DEFAULT 0,
    age_45_plus_ratio DECIMAL(8,4) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_mall_flow (mall_id, data_date),
    INDEX idx_mall_flow_date (data_date),
    INDEX idx_mall_flow_mall (mall_id)
) ENGINE=InnoDB;

-- 门店客流数据
CREATE TABLE IF NOT EXISTS store_flow_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    store_id VARCHAR(100) NOT NULL,
    data_date DATE NOT NULL,
    pass_by_count INT NOT NULL DEFAULT 0,
    pass_by_people INT NOT NULL DEFAULT 0,
    enter_count INT NOT NULL DEFAULT 0,
    enter_people INT NOT NULL DEFAULT 0,
    avg_stay_minutes DECIMAL(8,2) DEFAULT 0,
    male_ratio DECIMAL(8,4) DEFAULT 0,
    female_ratio DECIMAL(8,4) DEFAULT 0,
    age_18_24_ratio DECIMAL(8,4) DEFAULT 0,
    age_25_34_ratio DECIMAL(8,4) DEFAULT 0,
    age_35_44_ratio DECIMAL(8,4) DEFAULT 0,
    age_45_plus_ratio DECIMAL(8,4) DEFAULT 0,
    mall_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_store_flow (store_id, data_date),
    INDEX idx_store_flow_date (data_date),
    INDEX idx_store_flow_store (store_id)
) ENGINE=InnoDB;

-- 门店客流指数
CREATE TABLE IF NOT EXISTS store_flow_index (
    id INT AUTO_INCREMENT PRIMARY KEY,
    store_id VARCHAR(100) NOT NULL,
    calc_date DATE NOT NULL,
    index_value DECIMAL(10,2) NOT NULL DEFAULT 100,
    baseline DECIMAL(10,2) NOT NULL DEFAULT 0,
    actual_value DECIMAL(10,2) NOT NULL DEFAULT 0,
    year_over_year DECIMAL(8,2),
    month_over_month DECIMAL(8,2),
    volatility DECIMAL(8,4) DEFAULT 0,
    computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_store_idx (store_id, calc_date),
    INDEX idx_store_idx_date (calc_date)
) ENGINE=InnoDB;

-- 商场客流指数
CREATE TABLE IF NOT EXISTS mall_flow_index (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mall_id VARCHAR(100) NOT NULL,
    calc_date DATE NOT NULL,
    index_value DECIMAL(10,2) NOT NULL DEFAULT 100,
    baseline DECIMAL(10,2) NOT NULL DEFAULT 0,
    actual_value DECIMAL(10,2) NOT NULL DEFAULT 0,
    computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_mall_idx (mall_id, calc_date),
    INDEX idx_mall_idx_date (calc_date)
) ENGINE=InnoDB;

-- 诊断记录
CREATE TABLE IF NOT EXISTS diagnosis_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    store_id VARCHAR(100) NOT NULL,
    calc_date DATE NOT NULL,
    boston_x DECIMAL(10,2),
    boston_y DECIMAL(10,2),
    boston_quadrant VARCHAR(20),
    deviation DECIMAL(10,2),
    diagnosis_summary TEXT,
    ai_suggestion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_diag_store (store_id),
    INDEX idx_diag_date (calc_date)
) ENGINE=InnoDB;

-- 用户
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    email VARCHAR(200),
    phone VARCHAR(50),
    role_id INT,
    status VARCHAR(20) DEFAULT 'active',
    last_login_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 角色
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(500) DEFAULT '',
    data_scope VARCHAR(50) DEFAULT 'all',
    permissions JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 权限
CREATE TABLE IF NOT EXISTS permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    module VARCHAR(100) NOT NULL,
    description VARCHAR(500) DEFAULT ''
) ENGINE=InnoDB;

-- 预警规则
CREATE TABLE IF NOT EXISTS alert_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    rule_type VARCHAR(100) NOT NULL,
    conditions JSON NOT NULL,
    scope_type VARCHAR(50) DEFAULT 'global',
    scope_value VARCHAR(200),
    priority VARCHAR(20) DEFAULT 'warning',
    enabled TINYINT(1) DEFAULT 1,
    notify_channels JSON,
    notify_receivers JSON,
    cooldown_minutes INT DEFAULT 60,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 预警记录
CREATE TABLE IF NOT EXISTS alert_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    store_id VARCHAR(100),
    mall_id VARCHAR(100),
    rule_id INT,
    alert_type VARCHAR(100) NOT NULL,
    alert_level VARCHAR(20) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    metric_value DECIMAL(10,2),
    threshold_value DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'pending',
    handled_by INT,
    handled_at TIMESTAMP NULL,
    handle_note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_alert_store (store_id),
    INDEX idx_alert_status (status),
    INDEX idx_alert_created (created_at),
    FOREIGN KEY (rule_id) REFERENCES alert_rules(id)
) ENGINE=InnoDB;
