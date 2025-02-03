import { Hono } from 'hono'
import { z } from 'zod'
import { Bindings } from '..'
import { zValidator } from '@hono/zod-validator'
import { CarInspection } from '../models/carInspection'

export const CreateCarInspectionRequestSchema = z.object({
    // 共通フィールド
    car_id: z.string(),
    is_kcar: z.union([z.literal(0), z.literal(1)]),

    // BaseCarInspection
    chassis_number_stamp_location: z.string(),
    model_specification_number_category_classification_number: z
        .string()
        .optional(),
    expiration_date: z.string(),
    first_registration_year_month: z.string(),
    model: z.string(),
    axle_weight_ff: z.string(),
    axle_weight_rr: z.string(),
    noise_regulation: z.string(),
    proximity_exhaust_noise_limit: z.string(),
    fuel_type_code: z.string(),
    car_registration_number: z.string(),
    plate_count_size_preferred_number_identifier: z.string(),
    chassis_number: z.string(),
    engine_model: z.string(),
    document_type: z.string(),

    // Standard
    version_info_2: z.string().nullable(),
    axle_weight_fr: z.string().nullable(),
    axle_weight_rf: z.string().nullable(),
    drive_system: z.string().nullable(),
    opacimeter_measured_car: z.string().nullable(),
    nox_pm_measurement_mode: z.string().nullable(),
    nox_value: z.string().nullable(),
    pm_value: z.string().nullable(),
    safety_standard_application_date: z.string().nullable(),
    version_info_3: z.string().nullable(),

    // KCar
    system_id_2: z.union([z.literal('K'), z.null()]),
    version_number_2: z.union([z.literal('32'), z.null()]),
    k_axle_weight_fr: z.union([z.literal('-'), z.null()]),
    k_axle_weight_rf: z.union([z.literal('-'), z.null()]),
    k_drive_system: z.union([z.literal('-'), z.null()]),
    k_opacimeter_measured_car: z.union([z.literal('-'), z.null()]),
    k_nox_pm_measurement_mode: z.union([z.literal('-'), z.null()]),
    k_nox_value: z.union([z.literal('-'), z.null()]),
    k_pm_value: z.union([z.literal('-'), z.null()]),
    preliminary_item: z.union([z.literal('999'), z.null()]),
    system_id_3: z.union([z.literal('K'), z.null()]),
    version_number_3: z.union([z.literal('22'), z.null()]),
})

export const carInspection = new Hono<{ Bindings: Bindings }>()
    .post(
        '/',
        zValidator('json', CreateCarInspectionRequestSchema),
        async (c) => {
            try {
                const {
                    car_id,
                    is_kcar,
                    // BaseCarInspection
                    chassis_number_stamp_location,
                    model_specification_number_category_classification_number,
                    expiration_date,
                    first_registration_year_month,
                    model,
                    axle_weight_ff,
                    axle_weight_rr,
                    noise_regulation,
                    proximity_exhaust_noise_limit,
                    fuel_type_code,
                    car_registration_number,
                    plate_count_size_preferred_number_identifier,
                    chassis_number,
                    engine_model,
                    document_type,
                    // Standard
                    version_info_2,
                    axle_weight_fr,
                    axle_weight_rf,
                    drive_system,
                    opacimeter_measured_car,
                    nox_pm_measurement_mode,
                    nox_value,
                    pm_value,
                    safety_standard_application_date,
                    version_info_3,
                    // KCar
                    system_id_2,
                    version_number_2,
                    k_axle_weight_fr,
                    k_axle_weight_rf,
                    k_drive_system,
                    k_opacimeter_measured_car,
                    k_nox_pm_measurement_mode,
                    k_nox_value,
                    k_pm_value,
                    preliminary_item,
                    system_id_3,
                    version_number_3,
                } = await c.req.json()

                // まず、指定された car_id が Cars テーブルに存在するか確認
                const existingCar = await c.env.DB.prepare(
                    `SELECT * FROM Cars WHERE car_id = ?1`,
                )
                    .bind(car_id)
                    .first()

                if (!existingCar) {
                    return c.json(
                        { error: `Car with car_id ${car_id} does not exist` },
                        400,
                    )
                }

                // 最新のマイグレーションに合わせた INSERT 文（全39カラム）
                await c.env.DB.prepare(
                    `
                    INSERT INTO CarInspections (
                        car_id,
                        is_kcar,
                        chassis_number_stamp_location,
                        model_specification_number_category_classification_number,
                        expiration_date,
                        first_registration_year_month,
                        model,
                        axle_weight_ff,
                        axle_weight_rr,
                        noise_regulation,
                        proximity_exhaust_noise_limit,
                        fuel_type_code,
                        car_registration_number,
                        plate_count_size_preferred_number_identifier,
                        chassis_number,
                        engine_model,
                        document_type,
                        version_info_2,
                        axle_weight_fr,
                        axle_weight_rf,
                        drive_system,
                        opacimeter_measured_car,
                        nox_pm_measurement_mode,
                        nox_value,
                        pm_value,
                        safety_standard_application_date,
                        version_info_3,
                        system_id_2,
                        version_number_2,
                        k_axle_weight_fr,
                        k_axle_weight_rf,
                        k_drive_system,
                        k_opacimeter_measured_car,
                        k_nox_pm_measurement_mode,
                        k_nox_value,
                        k_pm_value,
                        preliminary_item,
                        system_id_3,
                        version_number_3
                    ) VALUES (
                        ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10,
                        ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20,
                        ?21, ?22, ?23, ?24, ?25, ?26, ?27, ?28, ?29, ?30,
                        ?31, ?32, ?33, ?34, ?35, ?36, ?37, ?38, ?39
                    )
                    `,
                )
                    .bind(
                        car_id, // ?1
                        is_kcar, // ?2
                        chassis_number_stamp_location, // ?3
                        model_specification_number_category_classification_number, // ?4
                        expiration_date, // ?5
                        first_registration_year_month, // ?6
                        model, // ?7
                        axle_weight_ff, // ?8
                        axle_weight_rr, // ?9
                        noise_regulation, // ?10
                        proximity_exhaust_noise_limit, // ?11
                        fuel_type_code, // ?12
                        car_registration_number, // ?13
                        plate_count_size_preferred_number_identifier, // ?14
                        chassis_number, // ?15
                        engine_model, // ?16
                        document_type, // ?17
                        version_info_2, // ?18
                        axle_weight_fr, // ?19
                        axle_weight_rf, // ?20
                        drive_system, // ?21
                        opacimeter_measured_car, // ?22
                        nox_pm_measurement_mode, // ?23
                        nox_value, // ?24
                        pm_value, // ?25
                        safety_standard_application_date, // ?26
                        version_info_3, // ?27
                        system_id_2, // ?28
                        version_number_2, // ?29
                        k_axle_weight_fr, // ?30
                        k_axle_weight_rf, // ?31
                        k_drive_system, // ?32
                        k_opacimeter_measured_car, // ?33
                        k_nox_pm_measurement_mode, // ?34
                        k_nox_value, // ?35
                        k_pm_value, // ?36
                        preliminary_item, // ?37
                        system_id_3, // ?38
                        version_number_3, // ?39
                    )
                    .run()

                const newCarInspection = await c.env.DB.prepare(
                    `
          SELECT * FROM CarInspections WHERE car_id = ?1
          `,
                )
                    .bind(car_id)
                    .first<CarInspection>()

                return c.json(newCarInspection, 201)
            } catch (err) {
                if (err instanceof z.ZodError) {
                    return c.json(
                        { error: 'Invalid input', details: err.errors },
                        400,
                    )
                }
                console.error('Error creating car inspection:', err)
                return c.json({ error: 'Internal Server Error' }, 500)
            }
        },
    )

    .get('/:car_id', async (c) => {
        try {
            const car_id = c.req.param('car_id')
            const carInspection = await c.env.DB.prepare(
                `
            SELECT * FROM CarInspections WHERE car_id = ?1
        `,
            )
                .bind(car_id)
                .first<CarInspection>()

            if (!carInspection) {
                return c.json(
                    { error: `Car inspection with car_id ${car_id} not found` },
                    404,
                )
            }

            return c.json(carInspection)
        } catch (err) {
            console.error('Error getting car inspection:', err)
            return c.json({ error: 'Internal Server Error' }, 500)
        }
    })

    .put(
        '/:car_id',
        zValidator('json', CreateCarInspectionRequestSchema),
        async (c) => {
            try {
                const car_id = c.req.param('car_id')

                // 対象の car_id の車検情報が存在するか確認
                const existingInspection = await c.env.DB.prepare(
                    `SELECT * FROM CarInspections WHERE car_id = ?1`,
                )
                    .bind(car_id)
                    .first<CarInspection>()

                if (!existingInspection) {
                    return c.json(
                        {
                            error: `Car inspection with car_id ${car_id} not found`,
                        },
                        404,
                    )
                }

                // リクエストボディから car_inspection オブジェクトを取得
                const { car_inspection } = await c.req.json()

                // 新しい定義に合わせたフィールド群を分割代入
                const {
                    is_kcar,
                    // BaseCarInspection
                    chassis_number_stamp_location,
                    model_specification_number_category_classification_number,
                    expiration_date,
                    first_registration_year_month,
                    model,
                    axle_weight_ff,
                    axle_weight_rr,
                    noise_regulation,
                    proximity_exhaust_noise_limit,
                    fuel_type_code,
                    car_registration_number,
                    plate_count_size_preferred_number_identifier,
                    chassis_number,
                    engine_model,
                    document_type,
                    // Standard
                    version_info_2,
                    axle_weight_fr,
                    axle_weight_rf,
                    drive_system,
                    opacimeter_measured_car,
                    nox_pm_measurement_mode,
                    nox_value,
                    pm_value,
                    safety_standard_application_date,
                    version_info_3,
                    // KCar
                    system_id_2,
                    version_number_2,
                    k_axle_weight_fr,
                    k_axle_weight_rf,
                    k_drive_system,
                    k_opacimeter_measured_car,
                    k_nox_pm_measurement_mode,
                    k_nox_value,
                    k_pm_value,
                    preliminary_item,
                    system_id_3,
                    version_number_3,
                } = car_inspection

                // 新しいカラム構成に合わせた UPDATE 文
                await c.env.DB.prepare(
                    `
              UPDATE CarInspections SET
                is_kcar = ?2,
                chassis_number_stamp_location = ?3,
                model_specification_number_category_classification_number = ?4,
                expiration_date = ?5,
                first_registration_year_month = ?6,
                model = ?7,
                axle_weight_ff = ?8,
                axle_weight_rr = ?9,
                noise_regulation = ?10,
                proximity_exhaust_noise_limit = ?11,
                fuel_type_code = ?12,
                car_registration_number = ?13,
                plate_count_size_preferred_number_identifier = ?14,
                chassis_number = ?15,
                engine_model = ?16,
                document_type = ?17,
                version_info_2 = ?18,
                axle_weight_fr = ?19,
                axle_weight_rf = ?20,
                drive_system = ?21,
                opacimeter_measured_car = ?22,
                nox_pm_measurement_mode = ?23,
                nox_value = ?24,
                pm_value = ?25,
                safety_standard_application_date = ?26,
                version_info_3 = ?27,
                system_id_2 = ?28,
                version_number_2 = ?29,
                k_axle_weight_fr = ?30,
                k_axle_weight_rf = ?31,
                k_drive_system = ?32,
                k_opacimeter_measured_car = ?33,
                k_nox_pm_measurement_mode = ?34,
                k_nox_value = ?35,
                k_pm_value = ?36,
                preliminary_item = ?37,
                system_id_3 = ?38,
                version_number_3 = ?39
              WHERE car_id = ?1
              `,
                )
                    .bind(
                        car_id, // ?1
                        is_kcar, // ?2
                        chassis_number_stamp_location, // ?3
                        model_specification_number_category_classification_number, // ?4
                        expiration_date, // ?5
                        first_registration_year_month, // ?6
                        model, // ?7
                        axle_weight_ff, // ?8
                        axle_weight_rr, // ?9
                        noise_regulation, // ?10
                        proximity_exhaust_noise_limit, // ?11
                        fuel_type_code, // ?12
                        car_registration_number, // ?13
                        plate_count_size_preferred_number_identifier, // ?14
                        chassis_number, // ?15
                        engine_model, // ?16
                        document_type, // ?17
                        version_info_2, // ?18
                        axle_weight_fr, // ?19
                        axle_weight_rf, // ?20
                        drive_system, // ?21
                        opacimeter_measured_car, // ?22
                        nox_pm_measurement_mode, // ?23
                        nox_value, // ?24
                        pm_value, // ?25
                        safety_standard_application_date, // ?26
                        version_info_3, // ?27
                        system_id_2, // ?28
                        version_number_2, // ?29
                        k_axle_weight_fr, // ?30
                        k_axle_weight_rf, // ?31
                        k_drive_system, // ?32
                        k_opacimeter_measured_car, // ?33
                        k_nox_pm_measurement_mode, // ?34
                        k_nox_value, // ?35
                        k_pm_value, // ?36
                        preliminary_item, // ?37
                        system_id_3, // ?38
                        version_number_3, // ?39
                    )
                    .run()

                const updatedCarInspection = await c.env.DB.prepare(
                    `
              SELECT * FROM CarInspections WHERE car_id = ?1
              `,
                )
                    .bind(car_id)
                    .first<CarInspection>()

                return c.json(updatedCarInspection)
            } catch (err) {
                console.error('Error updating car inspection:', err)
                return c.json({ error: 'Internal Server Error' }, 500)
            }
        },
    )

    .delete('/:car_id', async (c) => {
        try {
            const car_id = c.req.param('car_id')
            const carInspection = await c.env.DB.prepare(
                `
            SELECT * FROM CarInspections WHERE car_id = ?1
        `,
            )
                .bind(car_id)
                .first<CarInspection>()

            if (!carInspection) {
                return c.json(
                    {
                        error: `Car inspection with car_id ${car_id} not found`,
                    },
                    404,
                )
            }

            await c.env.DB.prepare(
                `
            DELETE FROM CarInspections WHERE car_id = ?1
        `,
            )
                .bind(car_id)
                .run()

            return c.json({ message: 'Car inspection deleted successfully' })
        } catch (err) {
            console.error('Error deleting car inspection:', err)
            return c.json({ error: 'Internal Server Error' }, 500)
        }
    })
