-- Migration number: 0001 	 2025-01-29T05:46:22.310Z
PRAGMA foreign_keys = ON;

CREATE TABLE Users (
    firebase_user_id TEXT NOT NULL UNIQUE,
    user_email TEXT NOT NULL UNIQUE,
    user_name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Cars (
    car_id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    car_id INTEGER NOT NULL,
    PRIMARY KEY (firebase_user_id, car_id),
    FOREIGN KEY (firebase_user_id) REFERENCES Users(firebase_user_id) ON DELETE CASCADE,
    FOREIGN KEY (car_id) REFERENCES Cars(car_id) ON DELETE CASCADE
);

CREATE TABLE Tunings (
    tuning_id INTEGER PRIMARY KEY AUTOINCREMENT,
    car_id INTEGER NOT NULL,
    tuning_name TEXT NOT NULL,
    tuning_date TEXT NOT NULL,
    tuning_description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (car_id) REFERENCES Cars(car_id) ON DELETE CASCADE
);

CREATE TABLE Maintenances (
    maint_id INTEGER PRIMARY KEY AUTOINCREMENT,
    car_id INTEGER NOT NULL,
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
    fe_id INTEGER PRIMARY KEY AUTOINCREMENT,
    car_id INTEGER NOT NULL,
    fe_date TEXT NOT NULL,
    fe_amount REAL NOT NULL,
    fe_unitprice INTEGER NOT NULL,
    fe_mileage REAL NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (car_id) REFERENCES Cars(car_id) ON DELETE CASCADE
);

CREATE TABLE Accidents (
    accident_id INTEGER PRIMARY KEY AUTOINCREMENT,
    car_id INTEGER NOT NULL,
    accident_date TEXT NOT NULL,
    accident_description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (car_id) REFERENCES Cars(car_id) ON DELETE CASCADE
);

CREATE TABLE PeriodicInspection (
    pi_id INTEGER PRIMARY KEY AUTOINCREMENT,
    car_id INTEGER NOT NULL,
    pi_name TEXT NOT NULL,
    pi_date TEXT NOT NULL,
    pi_nextdate TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (car_id) REFERENCES Cars(car_id) ON DELETE CASCADE
);
