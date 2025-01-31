import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { Bindings } from '../index'
import { v4 } from 'uuid'
import { FuelEfficiency } from '../models/fuel_efficiency'

const FuelEfficiencySchema = z.object({
    car_id: z.string().uuid(),
    fe_date: z.string(),
    fe_amount: z.number().positive(),
    fe_unitprice: z.number().positive(),
    fe_mileage: z.number().positive(),
})

export const fuelEfficiencyRoutes = new Hono<{ Bindings: Bindings }>()
    .post('/', zValidator('json', FuelEfficiencySchema), async (c) => {
        try {
            const { car_id, fe_date, fe_amount, fe_unitprice, fe_mileage } =
                await c.req.json()

            console.log('car_id:', car_id)
            console.log('fe_date:', fe_date)
            console.log('fe_amount:', fe_amount)
            console.log('fe_unitprice:', fe_unitprice)
            console.log('fe_mileage:', fe_mileage)

            const fe_id = v4()
            console.log('fe_id:', fe_id)

            await c.env.DB.prepare(
                `INSERT INTO FuelEfficiencies (fe_id, car_id, fe_date, fe_amount, fe_unitprice, fe_mileage) VALUES (?1, ?2, ?3, ?4, ?5, ?6)`,
            )
                .bind(
                    fe_id,
                    car_id,
                    fe_date,
                    fe_amount,
                    fe_unitprice,
                    fe_mileage,
                )
                .run()

            const fuelEfficiency = await c.env.DB.prepare(
                `SELECT * FROM FuelEfficiencies WHERE fe_id = ?1`,
            )
                .bind(fe_id)
                .first<FuelEfficiency>()

            console.log(
                'Fuel efficiency created JSON:',
                JSON.stringify(fuelEfficiency),
            )

            if (!fuelEfficiency) {
                return c.json({ error: 'Fuel efficiency creation failed' }, 500)
            }

            return c.json(fuelEfficiency, 201)
        } catch (err) {
            if (err instanceof z.ZodError) {
                return c.json(
                    { error: 'Invalid input', details: err.errors },
                    400,
                )
            }
            console.error('Error creating fuel efficiency:', err)
            return c.json({ error: 'Internal Server Error' }, 500)
        }
    })

    .get('/', async (c) => {
        try {
            const fuelEfficiencies = await c.env.DB.prepare(
                `SELECT * FROM FuelEfficiencies`,
            ).all()
            return c.json(fuelEfficiencies.results, 200)
        } catch (err) {
            console.error('Error fetching fuel efficiencies:', err)
            return c.json({ error: 'Internal Server Error' }, 500)
        }
    })

    .get('/:fe_id', async (c) => {
        try {
            const fe_id = c.req.param('fe_id')
            if (!fe_id) {
                return c.json({ error: 'Invalid fe_id' }, 400)
            }

            const fuelEfficiency = await c.env.DB.prepare(
                `SELECT * FROM FuelEfficiencies WHERE fe_id = ?1`,
            )
                .bind(fe_id)
                .first()

            if (!fuelEfficiency) {
                return c.json(
                    { error: 'Fuel efficiency record not found' },
                    404,
                )
            }

            return c.json(fuelEfficiency, 200)
        } catch (err) {
            console.error('Error fetching fuel efficiency:', err)
            return c.json({ error: 'Internal Server Error' }, 500)
        }
    })

    .put('/:fe_id', zValidator('json', FuelEfficiencySchema), async (c) => {
        try {
            const fe_id = c.req.param('fe_id')
            if (!fe_id) {
                return c.json({ error: 'Invalid fe_id' }, 400)
            }

            const { car_id, fe_date, fe_amount, fe_unitprice, fe_mileage } =
                await c.req.json()

            const result = await c.env.DB.prepare(
                `UPDATE FuelEfficiencies SET car_id = ?1, fe_date = ?2, fe_amount = ?3, fe_unitprice = ?4, fe_mileage = ?5 WHERE fe_id = ?6`,
            )
                .bind(
                    car_id,
                    fe_date,
                    fe_amount,
                    fe_unitprice,
                    fe_mileage,
                    fe_id,
                )
                .run()

            if (result.meta.changes === 0) {
                return c.json(
                    { error: 'Fuel efficiency not found or not updated' },
                    404,
                )
            }

            const updatedFuelEfficiency = await c.env.DB.prepare(
                `SELECT * FROM FuelEfficiencies WHERE fe_id = ?1`,
            )
                .bind(fe_id)
                .first()

            return c.json(updatedFuelEfficiency, 200)
        } catch (err) {
            console.error('Error updating fuel efficiency:', err)
            return c.json({ error: 'Internal Server Error' }, 500)
        }
    })

    .delete('/:fe_id', async (c) => {
        try {
            const fe_id = c.req.param('fe_id')
            if (!fe_id) {
                return c.json({ error: 'Invalid fe_id' }, 400)
            }

            const result = await c.env.DB.prepare(
                `DELETE FROM FuelEfficiencies WHERE fe_id = ?1`,
            )
                .bind(fe_id)
                .run()

            if (result.meta.changes === 0) {
                return c.json(
                    { error: 'Fuel efficiency record not found' },
                    404,
                )
            }

            return new Response(null, { status: 204 })
        } catch (err) {
            console.error('Error deleting fuel efficiency:', err)
            return c.json({ error: 'Internal Server Error' }, 500)
        }
    })
