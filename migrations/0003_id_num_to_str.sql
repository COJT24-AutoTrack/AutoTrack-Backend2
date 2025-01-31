-- Migration number: 0003 	 2025-01-31T16:53:02.443Z
-- Migration number: 0003 	 2025-02-01T10:00:00.000Z
PRAGMA foreign_keys = OFF;

-- テーブルの削除順序を考慮して、子テーブルから削除
DROP TABLE IF EXISTS CarInspections;
DROP TABLE IF EXISTS PeriodicInspection;
DROP TABLE IF EXISTS Accidents;
DROP TABLE IF EXISTS FuelEfficiencies;
DROP TABLE IF EXISTS Maintenances;
DROP TABLE IF EXISTS Tunings;
DROP TABLE IF EXISTS user_car;
DROP TABLE IF EXISTS Cars;
DROP TABLE IF EXISTS Users;

PRAGMA foreign_keys = ON;

-- 再作成するテーブルの定義（UUIDを主キーとして使用）

CREATE TABLE Users (
    firebase_user_id TEXT PRIMARY KEY,
    user_email TEXT NOT NULL UNIQUE,
    user_name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Cars (
    car_id TEXT PRIMARY KEY,
    car_name TEXT NOT NULL,
    carmodelnum TEXT NOT NULL,
    car_color TEXT NOT NULL,
    car_mileage INTEGER NOT NULL,
    car_isflooding INTEGER NOT NULL CHECK (car_isflooding IN (0,1)),
    car_issmoked INTEGER NOT NULL CHECK (car_issmoked IN (0,1)),
    car_image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_car (
    firebase_user_id TEXT NOT NULL,
    car_id TEXT NOT NULL,
    PRIMARY KEY (firebase_user_id, car_id),
    FOREIGN KEY (firebase_user_id) REFERENCES Users(firebase_user_id) ON DELETE CASCADE,
    FOREIGN KEY (car_id) REFERENCES Cars(car_id) ON DELETE CASCADE
);

CREATE TABLE Tunings (
    tuning_id TEXT PRIMARY KEY,
    car_id TEXT NOT NULL,
    tuning_name TEXT NOT NULL,
    tuning_date TEXT NOT NULL,
    tuning_description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (car_id) REFERENCES Cars(car_id) ON DELETE CASCADE
);

CREATE TABLE Maintenances (
    maint_id TEXT PRIMARY KEY,
    car_id TEXT NOT NULL,
    maint_type TEXT NOT NULL CHECK (maint_type IN (
        'Oil Change', 'Oil Filter Change', 'Headlight Change', 'Position Light Change', 'Fog Light Change',
        'Turn Signal Change', 'Brake Light Change', 'License Plate Light Change', 'Backup Light Change',
        'Car Wash', 'Wiper Blade Change', 'Brake Pad Change', 'Brake Disc Change', 'Tire Change',
        'Battery Change', 'Timing Belt Change', 'Coolant Refill', 'Washer Fluid Refill', 'Other'
    )),
    maint_title TEXT NOT NULL,
    maint_date TEXT NOT NULL,
    maint_description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (car_id) REFERENCES Cars(car_id) ON DELETE CASCADE
);

CREATE TABLE FuelEfficiencies (
    fe_id TEXT PRIMARY KEY,
    car_id TEXT NOT NULL,
    fe_date TEXT NOT NULL,
    fe_amount REAL NOT NULL,
    fe_unitprice INTEGER NOT NULL,
    fe_mileage REAL NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (car_id) REFERENCES Cars(car_id) ON DELETE CASCADE
);

CREATE TABLE Accidents (
    accident_id TEXT PRIMARY KEY,
    car_id TEXT NOT NULL,
    accident_date TEXT NOT NULL,
    accident_description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (car_id) REFERENCES Cars(car_id) ON DELETE CASCADE
);

CREATE TABLE PeriodicInspection (
    pi_id TEXT PRIMARY KEY,
    car_id TEXT NOT NULL,
    pi_name TEXT NOT NULL,
    pi_date TEXT NOT NULL,
    pi_nextdate TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (car_id) REFERENCES Cars(car_id) ON DELETE CASCADE
);

CREATE TABLE CarInspections (
    car_id TEXT PRIMARY KEY,
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
    preliminary_item TEXT NULL,
    FOREIGN KEY (car_id) REFERENCES Cars(car_id) ON DELETE CASCADE
);
