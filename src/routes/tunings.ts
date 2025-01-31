import { Hono } from 'hono'
import { Bindings } from '../index'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'

export const CreateTuningRequestSchema = z.object({
    tuning_id: z.number().int().optional(), // Optional because it's auto-generated
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
            const { tuning_name, tuning_price, tuning_image_url } =
                CreateTuningRequestSchema.parse(await c.req.json())

            await c.env.DB.prepare(
                `INSERT INTO Tunings (tuning_name, tuning_price, tuning_image_url) VALUES (?1, ?2, ?3)`,
            )
                .bind(tuning_name, tuning_price, tuning_image_url || null)
                .run()

            return c.json({ status: 'new_tuning' })
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
