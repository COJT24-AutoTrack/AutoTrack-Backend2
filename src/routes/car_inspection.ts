import { Hono } from 'hono'
import { z } from 'zod'
import { Bindings } from '..'
import { zValidator } from '@hono/zod-validator'
import { CarInspection } from '../models/carInspection'

const CreateCarInspectionRequestSchema = z.object({
    car_id: z.number(),
    is_kcar: z.union([z.literal(0), z.literal(1)]),
    version_info_1: z.string().optional().nullable(),
    registration_version_info: z.string().optional().nullable(),
    chassis_number_stamp_location: z.string().optional().nullable(),
    model_specification_number_category_classification_number: z
        .string()
        .optional()
        .nullable(),
    expiration_date: z.string().optional().nullable(),
    first_registration_year_month: z.string().optional().nullable(),
    model: z.string().optional().nullable(),
    axle_weight_ff: z.number().optional().nullable(),
    axle_weight_fr: z.number().optional().nullable(),
    axle_weight_rf: z.number().optional().nullable(),
    axle_weight_rr: z.number().optional().nullable(),
    noise_regulation: z.string().optional().nullable(),
    proximity_exhaust_noise_limit: z.number().optional().nullable(),
    drive_system: z.string().optional().nullable(),
    opacimeter_measured_car: z.union([z.literal(0), z.literal(1)]).optional(),
    nox_pm_measurement_mode: z.string().optional().nullable(),
    nox_value: z.number().optional().nullable(),
    pm_value: z.number().optional().nullable(),
    fuel_type_code: z.string().optional().nullable(),
    version_info_2: z.string().optional().nullable(),
    car_registration_number: z.string().optional().nullable(),
    plate_count_size_preferred_number_identifier: z
        .string()
        .optional()
        .nullable(),
    chassis_number: z.string().optional().nullable(),
    engine_model: z.string().optional().nullable(),
    document_type: z.string().optional().nullable(),
    safety_standard_application_date: z.string().optional().nullable(),
    system_id_1: z.string().optional().nullable(),
    system_id_2: z.string().optional().nullable(),
    version_number: z.string().optional().nullable(),
    preliminary_item: z.string().optional().nullable(),
})

export const carInspection = new Hono<{ Bindings: Bindings }>()
    .post(
        '/',
        zValidator('json', CreateCarInspectionRequestSchema),
        async (c) => {
            try {
                const { car_inspection } = await c.req.json()
                const {
                    car_id,
                    is_kcar,
                    version_info_1,
                    registration_version_info,
                    chassis_number_stamp_location,
                    model_specification_number_category_classification_number,
                    expiration_date,
                    first_registration_year_month,
                    model,
                    axle_weight_ff,
                    axle_weight_fr,
                    axle_weight_rf,
                    axle_weight_rr,
                    noise_regulation,
                    proximity_exhaust_noise_limit,
                    drive_system,
                    opacimeter_measured_car,
                    nox_pm_measurement_mode,
                    nox_value,
                    pm_value,
                    fuel_type_code,
                    version_info_2,
                    car_registration_number,
                    plate_count_size_preferred_number_identifier,
                    chassis_number,
                    engine_model,
                    document_type,
                    safety_standard_application_date,
                    system_id_1,
                    system_id_2,
                    version_number,
                    preliminary_item,
                } = car_inspection

                // まず、指定されたcar_idが存在するか確認します
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

                await c.env.DB.prepare(
                    `
                INSERT INTO CarInspections (
                    car_id,
                    is_kcar,
                    version_info_1,
                    registration_version_info,
                    chassis_number_stamp_location,
                    model_specification_number_category_classification_number,
                    expiration_date,
                    first_registration_year_month,
                    model,
                    axle_weight_ff,
                    axle_weight_fr,
                    axle_weight_rf,
                    axle_weight_rr,
                    noise_regulation,
                    proximity_exhaust_noise_limit,
                    drive_system,
                    opacimeter_measured_car,
                    nox_pm_measurement_mode,
                    nox_value,
                    pm_value,
                    fuel_type_code,
                    version_info_2,
                    car_registration_number,
                    plate_count_size_preferred_number_identifier,
                    chassis_number,
                    engine_model,
                    document_type,
                    safety_standard_application_date,
                    system_id_1,
                    system_id_2,
                    version_number,
                    preliminary_item
                ) VALUES (
                    ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10,
                    ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18,
                    ?19, ?20, ?21, ?22, ?23, ?24, ?25, ?26,
                    ?27, ?28, ?29, ?30, ?31, ?32
                )
            `,
                )
                    .bind(
                        car_id,
                        is_kcar,
                        version_info_1,
                        registration_version_info,
                        chassis_number_stamp_location,
                        model_specification_number_category_classification_number,
                        expiration_date,
                        first_registration_year_month,
                        model,
                        axle_weight_ff,
                        axle_weight_fr,
                        axle_weight_rf,
                        axle_weight_rr,
                        noise_regulation,
                        proximity_exhaust_noise_limit,
                        drive_system,
                        opacimeter_measured_car,
                        nox_pm_measurement_mode,
                        nox_value,
                        pm_value,
                        fuel_type_code,
                        version_info_2,
                        car_registration_number,
                        plate_count_size_preferred_number_identifier,
                        chassis_number,
                        engine_model,
                        document_type,
                        safety_standard_application_date,
                        system_id_1,
                        system_id_2,
                        version_number,
                        preliminary_item,
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
            const car_id = parseInt(c.req.param('car_id'))
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
                const car_id = parseInt(c.req.param('car_id'))
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

                const { car_inspection } = await c.req.json()
                const {
                    is_kcar,
                    version_info_1,
                    registration_version_info,
                    chassis_number_stamp_location,
                    model_specification_number_category_classification_number,
                    expiration_date,
                    first_registration_year_month,
                    model,
                    axle_weight_ff,
                    axle_weight_fr,
                    axle_weight_rf,
                    axle_weight_rr,
                    noise_regulation,
                    proximity_exhaust_noise_limit,
                    drive_system,
                    opacimeter_measured_car,
                    nox_pm_measurement_mode,
                    nox_value,
                    pm_value,
                    fuel_type_code,
                    version_info_2,
                    car_registration_number,
                    plate_count_size_preferred_number_identifier,
                    chassis_number,
                    engine_model,
                    document_type,
                    safety_standard_application_date,
                    system_id_1,
                    system_id_2,
                    version_number,
                    preliminary_item,
                } = car_inspection

                await c.env.DB.prepare(
                    `
            UPDATE CarInspections SET
                is_kcar = ?2,
                version_info_1 = ?3,
                registration_version_info = ?4,
                chassis_number_stamp_location = ?5,
                model_specification_number_category_classification_number = ?6,
                expiration_date = ?7,
                first_registration_year_month = ?8,
                model = ?9,
                axle_weight_ff = ?10,
                axle_weight_fr = ?11,
                axle_weight_rf = ?12,
                axle_weight_rr = ?13,
                noise_regulation = ?14,
                proximity_exhaust_noise_limit = ?15,
                drive_system = ?16,
                opacimeter_measured_car = ?17,
                nox_pm_measurement_mode = ?18,
                nox_value = ?19,
                pm_value = ?20,
                fuel_type_code = ?21,
                version_info_2 = ?22,
                car_registration_number = ?23,
                plate_count_size_preferred_number_identifier = ?24,
                chassis_number = ?25,
                engine_model = ?26,
                document_type = ?27,
                safety_standard_application_date = ?28,
                system_id_1 = ?29,
                system_id_2 = ?30,
                version_number = ?31,
                preliminary_item = ?32
            WHERE car_id = ?1
        `,
                )
                    .bind(
                        car_id,
                        is_kcar,
                        version_info_1,
                        registration_version_info,
                        chassis_number_stamp_location,
                        model_specification_number_category_classification_number,
                        expiration_date,
                        first_registration_year_month,
                        model,
                        axle_weight_ff,
                        axle_weight_fr,
                        axle_weight_rf,
                        axle_weight_rr,
                        noise_regulation,
                        proximity_exhaust_noise_limit,
                        drive_system,
                        opacimeter_measured_car,
                        nox_pm_measurement_mode,
                        nox_value,
                        pm_value,
                        fuel_type_code,
                        version_info_2,
                        car_registration_number,
                        plate_count_size_preferred_number_identifier,
                        chassis_number,
                        engine_model,
                        document_type,
                        safety_standard_application_date,
                        system_id_1,
                        system_id_2,
                        version_number,
                        preliminary_item,
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
            const car_id = parseInt(c.req.param('car_id'))
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
