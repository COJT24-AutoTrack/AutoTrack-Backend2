import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { Bindings } from '../index'
import { v4 } from 'uuid'
import { Accident } from '../models/accident'

const AccidentSchema = z.object({
    car_id: z.number().int(),
    accident_date: z.string().datetime(),
    accident_description: z.string(),
})
export const accidentsRoutes = new Hono<{ Bindings: Bindings }>()
    .post('/', zValidator('json', AccidentSchema), async (c) => {
        try {
            const { car_id, accident_date, accident_description } =
                await c.req.json()

            // const insertStmt = await c.env.DB.prepare(
            //     `INSERT INTO Accidents (car_id, accident_date, accident_description) VALUES (?1, ?2, ?3) RETURNING accident_id`,
            // )
            //     .bind(car_id, accident_date, accident_description)
            //     .run()

            // const accident_id = insertStmt.meta.last_row_id
            // if (!accident_id) {
            //     return c.json({ error: 'Failed to insert accident' }, 500)
            // }

            // const accident = await c.env.DB.prepare(
            //     `SELECT * FROM Accidents WHERE accident_id = ?1`,
            // )
            //     .bind(accident_id)
            //     .first()

            const accident_id = v4()

            await c.env.DB.prepare(
                `INSERT INTO Accidents (accident_id, car_id, accident_date, accident_description) VALUES (?1, ?2, ?3, ?4)`,
            )
                .bind(accident_id, car_id, accident_date, accident_description)
                .run()

            const accident = await c.env.DB.prepare(
                `SELECT * FROM Accidents WHERE accident_id = ?1`,
            )
                .bind(accident_id)
                .first<Accident>()

            if (!accident) {
                return c.json({ error: 'Failed to insert accident' }, 500)
            }

            return c.json(accident, 201)
        } catch (err) {
            if (err instanceof z.ZodError) {
                return c.json(
                    { error: 'Invalid input', details: err.errors },
                    400,
                )
            }
            console.error('Error creating accident:', err)
            return c.json({ error: 'Internal Server Error' }, 500)
        }
    })

    .get('/', async (c) => {
        try {
            const accidents = await c.env.DB.prepare(
                `SELECT * FROM Accidents`,
            ).all()
            return c.json(accidents.results, 200)
        } catch (err) {
            console.error('Error fetching accidents:', err)
            return c.json({ error: 'Internal Server Error' }, 500)
        }
    })

    .get('/:accident_id', async (c) => {
        try {
            const accident_id = parseInt(c.req.param('accident_id'), 10)
            if (isNaN(accident_id)) {
                return c.json({ error: 'Invalid accident_id' }, 400)
            }

            const accident = await c.env.DB.prepare(
                `SELECT * FROM Accidents WHERE accident_id = ?1`,
            )
                .bind(accident_id)
                .first()

            if (!accident) {
                return c.json({ error: 'Accident not found' }, 404)
            }

            return c.json(accident, 200)
        } catch (err) {
            console.error('Error fetching accident:', err)
            return c.json({ error: 'Internal Server Error' }, 500)
        }
    })

    .put('/:accident_id', zValidator('json', AccidentSchema), async (c) => {
        try {
            const accident_id = parseInt(c.req.param('accident_id'), 10)
            if (isNaN(accident_id)) {
                return c.json({ error: 'Invalid accident_id' }, 400)
            }

            const { car_id, accident_date, accident_description } =
                await c.req.json()

            const result = await c.env.DB.prepare(
                `UPDATE Accidents SET car_id = ?1, accident_date = ?2, accident_description = ?3 WHERE accident_id = ?4`,
            )
                .bind(car_id, accident_date, accident_description, accident_id)
                .run()

            if (result.meta.changes === 0) {
                return c.json(
                    { error: 'Accident not found or not updated' },
                    404,
                )
            }

            const updatedAccident = await c.env.DB.prepare(
                `SELECT * FROM Accidents WHERE accident_id = ?1`,
            )
                .bind(accident_id)
                .first()

            return c.json(updatedAccident, 200)
        } catch (err) {
            console.error('Error updating accident:', err)
            return c.json({ error: 'Internal Server Error' }, 500)
        }
    })

    .delete('/:accident_id', async (c) => {
        try {
            const accident_id = parseInt(c.req.param('accident_id'), 10)
            if (isNaN(accident_id)) {
                return c.json({ error: 'Invalid accident_id' }, 400)
            }

            const result = await c.env.DB.prepare(
                `DELETE FROM Accidents WHERE accident_id = ?1`,
            )
                .bind(accident_id)
                .run()

            if (result.meta.changes === 0) {
                return c.json({ error: 'Accident not found' }, 404)
            }

            return new Response(null, { status: 204 })
        } catch (err) {
            console.error('Error deleting accident:', err)
            return c.json({ error: 'Internal Server Error' }, 500)
        }
    })
