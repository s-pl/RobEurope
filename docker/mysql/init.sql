-- ============================================================
-- RobEurope MySQL Init
-- Creates all three databases and grants the app user access
-- ============================================================

CREATE DATABASE IF NOT EXISTS robeurope_dev  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS robeurope_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS robeurope_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Grant access to the application user on all databases
GRANT ALL PRIVILEGES ON robeurope_dev.*  TO 'robeurope_user'@'%';
GRANT ALL PRIVILEGES ON robeurope_test.* TO 'robeurope_user'@'%';
GRANT ALL PRIVILEGES ON robeurope_prod.* TO 'robeurope_user'@'%';

FLUSH PRIVILEGES;
