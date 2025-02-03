-- Migration number: 0004 	 2025-02-03T16:15:45.707Z
DROP TABLE IF EXISTS CarInspections;

CREATE TABLE CarInspections (
    car_id TEXT PRIMARY KEY,
    is_kcar INTEGER NOT NULL CHECK (is_kcar IN (0, 1)),

	chassis_number_stamp_location TEXT,
	model_specification_number_category_classification_number TEXT,
	expiration_date TEXT,
	first_registration_year_month TEXT,
	model TEXT,
	axle_weight_ff TEXT,
	axle_weight_rr TEXT,
	noise_regulation TEXT,
    proximity_exhaust_noise_limit TEXT,
    fuel_type_code TEXT,
    car_registration_number TEXT,
	plate_count_size_preferred_number_identifier TEXT,
	chassis_number TEXT,
    engine_model TEXT,
    document_type TEXT,
	-- 普通自動車
    version_info_2 TEXT NULL,
	axle_weight_fr TEXT NULL,
	axle_weight_rf TEXT NULL,
	drive_system TEXT NULL,
	opacimeter_measured_car TEXT NULL,
	nox_pm_measurement_mode TEXT NULL,
    nox_value TEXT NULL,
    pm_value TEXT NULL,
	safety_standard_application_date TEXT NULL,
	version_info_3 TEXT NULL,
	-- 軽自動車
	system_id_2 TEXT NULL,
	version_number_2 TEXT NULL,
	k_axle_weight_fr TEXT NULL,
	k_axle_weight_rf TEXT NULL,
	k_drive_system TEXT NULL,
	k_opacimeter_measured_car TEXT NULL,
	k_nox_pm_measurement_mode TEXT NULL,
	k_nox_value TEXT NULL,
	k_pm_value TEXT NULL,
	preliminary_item TEXT NULL,
	system_id_3 TEXT NULL,
	version_number_3 TEXT NULL,
	-- 外部キー
	FOREIGN KEY (car_id) REFERENCES Cars(car_id) ON DELETE CASCADE
);