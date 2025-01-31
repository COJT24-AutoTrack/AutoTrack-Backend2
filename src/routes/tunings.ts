import { Hono } from 'hono'
import { Bindings } from '../index'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { v4 } from 'uuid'
import { Tuning } from '../models/tuning'

const CreateTuningRequestSchema = z.object({
    car_id: z.string().uuid(),
    tuning_name: z.string(),
    tuning_price: z.number().int(),
    tuning_image_url: z.string().nullable().optional(), // Nullable for Option<String>
    created_at: z.string().datetime().optional(), // Optional because it's auto-generated
    updated_at: z.string().datetime().optional(),
    firebase_user_id: z.string(),
})

export const tuningRoutes = new Hono<{ Bindings: Bindings }>().post(
    '/',
    zValidator('json', CreateTuningRequestSchema),
    async (c) => {
        try {
            const { car_id, tuning_name, tuning_price, tuning_image_url } =
                CreateTuningRequestSchema.parse(await c.req.json())

            const tuning_id = v4()

            await c.env.DB.prepare(
                `INSERT INTO Tunings (tuning_id, car_id, tuning_name, tuning_price, tuning_image_url) VALUES (?1, ?2, ?3, ?4, ?5)`,
            ).bind(
                tuning_id,
                car_id,
                tuning_name,
                tuning_price,
                tuning_image_url || null,
            )

            const tuning = await c.env.DB.prepare(
                `SELECT * FROM Tunings WHERE tuning_id = ?1`,
            )
                .bind(tuning_id)
                .first<Tuning>()

            if (!tuning) {
                return c.json({ error: 'Tuning creation failed' }, 500)
            }

            return c.json(tuning, 201)
        } catch (err) {
            if (err instanceof z.ZodError) {
                return c.json(
                    { error: 'Invalid input', details: err.errors },
                    400,
                )
            }
            return c.json({ error: err }, 500)
        }
    },
)
