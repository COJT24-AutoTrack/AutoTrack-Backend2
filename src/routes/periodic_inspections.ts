import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { Bindings } from '../index'

export const periodicInspectionsRoutes = new Hono<{ Bindings: Bindings }>()

const PeriodicInspectionSchema = z.object({
    car_id: z.number().int(),
    pi_name: z.string(),
    pi_date: z.string().datetime(),
    pi_nextdate: z.string().datetime()
})

periodicInspectionsRoutes.post(
    '/',
    zValidator('json', PeriodicInspectionSchema),
    async (c) => {
        try {
            const { car_id, pi_name, pi_date, pi_nextdate } = await c.req.json()

            const insertStmt = await c.env.DB.prepare(
                `INSERT INTO PeriodicInspection (car_id, pi_name, pi_date, pi_nextdate) VALUES (?1, ?2, ?3, ?4) RETURNING pi_id`
            )
                .bind(car_id, pi_name, pi_date, pi_nextdate)
                .run()

            const pi_id = insertStmt.meta.last_row_id
            if (!pi_id) {
                return c.json({ error: 'Failed to insert periodic inspection' }, 500)
            }

            const periodicInspection = await c.env.DB.prepare(
                `SELECT * FROM PeriodicInspection WHERE pi_id = ?1`
            )
                .bind(pi_id)
                .first()

            return c.json(periodicInspection, 201)
        } catch (err) {
            if (err instanceof z.ZodError) {
                return c.json({ error: 'Invalid input', details: err.errors }, 400)
            }
            console.error('Error creating periodic inspection:', err)
            return c.json({ error: 'Internal Server Error' }, 500)
        }
    }
)

periodicInspectionsRoutes.get('/', async (c) => {
    try {
        const periodicInspections = await c.env.DB.prepare(`SELECT * FROM PeriodicInspection`).all()
        return c.json(periodicInspections.results, 200)
    } catch (err) {
        console.error('Error fetching periodic inspections:', err)
        return c.json({ error: 'Internal Server Error' }, 500)
    }
})

periodicInspectionsRoutes.get('/:pi_id', async (c) => {
    try {
        const pi_id = parseInt(c.req.param('pi_id'), 10)
        if (isNaN(pi_id)) {
            return c.json({ error: 'Invalid pi_id' }, 400)
        }

        const periodicInspection = await c.env.DB.prepare(
            `SELECT * FROM PeriodicInspection WHERE pi_id = ?1`
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

periodicInspectionsRoutes.put(
    '/:pi_id',
    zValidator('json', PeriodicInspectionSchema),
    async (c) => {
        try {
            const pi_id = parseInt(c.req.param('pi_id'), 10)
            if (isNaN(pi_id)) {
                return c.json({ error: 'Invalid pi_id' }, 400)
            }

            const { car_id, pi_name, pi_date, pi_nextdate } = await c.req.json()

            const result = await c.env.DB.prepare(
                `UPDATE PeriodicInspection SET car_id = ?1, pi_name = ?2, pi_date = ?3, pi_nextdate = ?4 WHERE pi_id = ?5`
            )
                .bind(car_id, pi_name, pi_date, pi_nextdate, pi_id)
                .run()

            if (result.meta.changes === 0) {
                return c.json({ error: 'Periodic inspection not found or not updated' }, 404)
            }

            const updatedPeriodicInspection = await c.env.DB.prepare(
                `SELECT * FROM PeriodicInspection WHERE pi_id = ?1`
            )
                .bind(pi_id)
                .first()

            return c.json(updatedPeriodicInspection, 200)
        } catch (err) {
            console.error('Error updating periodic inspection:', err)
            return c.json({ error: 'Internal Server Error' }, 500)
        }
    }
)

periodicInspectionsRoutes.delete('/:pi_id', async (c) => {
    try {
        const pi_id = parseInt(c.req.param('pi_id'), 10)
        if (isNaN(pi_id)) {
            return c.json({ error: 'Invalid pi_id' }, 400)
        }

        const result = await c.env.DB.prepare(
            `DELETE FROM PeriodicInspection WHERE pi_id = ?1`
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
