interface BaseCarInspection {
    chassis_number_stamp_location: string
    model_specification_number_category_classification_number?: string // 10 可変/ 9 固定
    expiration_date: string
    first_registration_year_month: string // // first_inspection_year_month
    model: string // 17 可変/ 20 可変
    axle_weight_ff: string
    axle_weight_rr: string
    noise_regulation: string // 取る値が変わる
    proximity_exhaust_noise_limit: string
    fuel_type_code: string // 取る値が変わる
    car_registration_number: string // // car_number
    plate_count_size_preferred_number_identifier: string // 取る値の対応表が変わる
    chassis_number: string // 23 可変/ 20 固定
    engine_model: string
    document_type: string
}

interface Standard {
    version_info_2: string | null
    axle_weight_fr: string | null
    axle_weight_rf: string | null
    drive_system: string | null
    opacimeter_measured_car: string | null
    nox_pm_measurement_mode: string | null
    nox_value: string | null
    pm_value: string | null
    safety_standard_application_date: string | null
    version_info_3: string | null
}

interface KCar {
    system_id_2: 'K' | null
    version_number_2: '32' | null
    k_axle_weight_fr: '-' | null
    k_axle_weight_rf: '-' | null
    k_drive_system: '-' | null
    k_opacimeter_measured_car: '-' | null
    k_nox_pm_measurement_mode: '-' | null
    k_nox_value: '-' | null
    k_pm_value: '-' | null
    preliminary_item: '999' | null
    system_id_3: 'K' | null
    version_number_3: '22' | null
}

export type CarInspection = {
    car_id: string
    is_kcar: 0 | 1
} & BaseCarInspection &
    Standard &
    KCar
