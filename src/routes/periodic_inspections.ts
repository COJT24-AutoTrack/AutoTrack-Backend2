import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { Bindings } from '../index'
import { v4 } from 'uuid'
import { PeriodicInspection } from '../models/periodic_inspection'

const PeriodicInspectionSchema = z.object({
    car_id: z.number().int(),
    pi_name: z.string(),
    pi_date: z.string().datetime(),
    pi_nextdate: z.string().datetime(),
})
export const periodicInspectionsRoutes = new Hono<{
    Bindings: Bindings
}>()
    .post('/', zValidator('json', PeriodicInspectionSchema), async (c) => {
        try {
            const { car_id, pi_name, pi_date, pi_nextdate } = await c.req.json()

            const pi_id = v4()

            await c.env.DB.prepare(
                `INSERT INTO PeriodicInspection (pi_id, car_id, pi_name, pi_date, pi_nextdate) VALUES (?1, ?2, ?3, ?4, ?5)`,
            )
                .bind(pi_id, car_id, pi_name, pi_date, pi_nextdate)
                .run()

            const periodicInspection = await c.env.DB.prepare(
                `SELECT * FROM PeriodicInspection WHERE pi_id = ?1`,
            )
                .bind(pi_id)
                .first<PeriodicInspection>()

            if (!periodicInspection) {
                return c.json(
                    { error: 'Periodic inspection creation failed' },
                    500,
                )
            }

            return c.json(periodicInspection, 201)
        } catch (err) {
            if (err instanceof z.ZodError) {
                return c.json(
                    { error: 'Invalid input', details: err.errors },
                    400,
                )
            }
            console.error('Error creating periodic inspection:', err)
            return c.json({ error: 'Internal Server Error' }, 500)
        }
    })

    .get('/', async (c) => {
        try {
            const periodicInspections = await c.env.DB.prepare(
                `SELECT * FROM PeriodicInspection`,
            ).all()
            return c.json(periodicInspections.results, 200)
        } catch (err) {
            console.error('Error fetching periodic inspections:', err)
            return c.json({ error: 'Internal Server Error' }, 500)
        }
    })

    .get('/:pi_id', async (c) => {
        try {
            const pi_id = c.req.param('pi_id')
            if (!pi_id) {
                return c.json({ error: 'Invalid pi_id' }, 400)
            }

            const periodicInspection = await c.env.DB.prepare(
                `SELECT * FROM PeriodicInspection WHERE pi_id = ?1`,
            )
                .bind(pi_id)
                .first()

            if (!periodicInspection) {
                return c.json({ error: 'Periodic inspection not found' }, 404)
            }

            return c.json(periodicInspection, 200)
        } catch (err) {
            console.error('Error fetching periodic inspection:', err)
            return c.json({ error: 'Internal Server Error' }, 500)
        }
    })

    .put('/:pi_id', zValidator('json', PeriodicInspectionSchema), async (c) => {
        try {
            const pi_id = c.req.param('pi_id')
            if (!pi_id) {
                return c.json({ error: 'Invalid pi_id' }, 400)
            }

            const { car_id, pi_name, pi_date, pi_nextdate } = await c.req.json()

            const result = await c.env.DB.prepare(
                `UPDATE PeriodicInspection SET car_id = ?1, pi_name = ?2, pi_date = ?3, pi_nextdate = ?4 WHERE pi_id = ?5`,
            )
                .bind(car_id, pi_name, pi_date, pi_nextdate, pi_id)
                .run()

            if (result.meta.changes === 0) {
                return c.json(
                    { error: 'Periodic inspection not found or not updated' },
                    404,
                )
            }

            const updatedPeriodicInspection = await c.env.DB.prepare(
                `SELECT * FROM PeriodicInspection WHERE pi_id = ?1`,
            )
                .bind(pi_id)
                .first()

            return c.json(updatedPeriodicInspection, 200)
        } catch (err) {
            console.error('Error updating periodic inspection:', err)
            return c.json({ error: 'Internal Server Error' }, 500)
        }
    })

    .delete('/:pi_id', async (c) => {
        try {
            const pi_id = c.req.param('pi_id')
            if (!pi_id) {
                return c.json({ error: 'Invalid pi_id' }, 400)
            }

            const result = await c.env.DB.prepare(
                `DELETE FROM PeriodicInspection WHERE pi_id = ?1`,
            )
                .bind(pi_id)
                .run()

            if (result.meta.changes === 0) {
                return c.json({ error: 'Periodic inspection not found' }, 404)
            }

            return new Response(null, { status: 204 })
        } catch (err) {
            console.error('Error deleting periodic inspection:', err)
            return c.json({ error: 'Internal Server Error' }, 500)
        }
    })
