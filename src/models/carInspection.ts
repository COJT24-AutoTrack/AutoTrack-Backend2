interface BaseCarInspection {
    car_id: number
    is_kcar: 0 | 1
    version_info_1?: string
    registration_version_info?: string // 登録情報のバージョン情報
    chassis_number_stamp_location?: string
    model_specification_number_category_classification_number?: string
    expiration_date?: string // YYYY-MM-DD
    first_registration_year_month?: string // YYYY-MM
    model?: string
    axle_weight_ff?: number // 軸重(前前)
    axle_weight_fr?: number // 軸重(前後)
    axle_weight_rf?: number // 軸重(後前)
    axle_weight_rr?: number // 軸重(後後)
    noise_regulation?: string
    proximity_exhaust_noise_limit?: number // dB
    drive_system?: string
    opacimeter_measured_car?: boolean
    nox_pm_measurement_mode?: string
    nox_value?: number // g/km
    pm_value?: number // g/km
    fuel_type_code?: string
    version_info_2?: string
    car_registration_number?: string
    plate_count_size_preferred_number_identifier?: string
    chassis_number?: string
    engine_model?: string
    document_type?: string
}
export interface CarInspection extends BaseCarInspection {
    safety_standard_application_date?: string
    system_id_1?: string
    system_id_2?: string
    version_number?: string
    preliminary_item?: string
}

// export interface StandardCarInspection extends BaseCarInspection {
//     safety_standard_application_date?: string
// }

// export interface KCarInspection extends BaseCarInspection {
//     system_id_1?: string
//     system_id_2?: string
//     version_number?: string
//     preliminary_item?: string
// }
