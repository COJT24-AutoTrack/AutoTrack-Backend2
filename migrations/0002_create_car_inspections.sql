-- Migration number: 0002 	 2025-01-31T15:40:26.270Z
CREATE TABLE CarInspections (
    car_id INTEGER PRIMARY KEY,
    is_kcar INTEGER NOT NULL CHECK (is_kcar IN (0, 1)),
    version_info_1 TEXT NULL,
    registration_version_info TEXT NULL,
    chassis_number_stamp_location TEXT NULL,
    model_specification_number_category_classification_number TEXT NULL,
    expiration_date TEXT NULL CHECK (expiration_date GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]'), -- YYYY-MM-DD
    first_registration_year_month TEXT NULL CHECK (first_registration_year_month GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]'), -- YYYY-MM
    model TEXT NULL,
    axle_weight_ff REAL NULL,
    axle_weight_fr REAL NULL,
    axle_weight_rf REAL NULL,
    axle_weight_rr REAL NULL,
    noise_regulation TEXT NULL,
    proximity_exhaust_noise_limit REAL NULL,
    drive_system TEXT NULL,
    opacimeter_measured_car INTEGER NULL CHECK (opacimeter_measured_car IN (0, 1)), -- BOOLEAN
    nox_pm_measurement_mode TEXT NULL,
    nox_value REAL NULL,
    pm_value REAL NULL,
    fuel_type_code TEXT NULL,
    version_info_2 TEXT NULL,
    car_registration_number TEXT NULL,
    plate_count_size_preferred_number_identifier TEXT NULL,
    chassis_number TEXT NULL,
    engine_model TEXT NULL,
    document_type TEXT NULL,
    safety_standard_application_date TEXT NULL CHECK (safety_standard_application_date GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]'), -- YYYY-MM-DD
    system_id_1 TEXT NULL,
    system_id_2 TEXT NULL,
    version_number TEXT NULL,
    preliminary_item TEXT NULL
);
