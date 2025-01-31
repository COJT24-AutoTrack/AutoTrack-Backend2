import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { Bindings } from '../index'
import { User } from '../models/user'

const UserSchema = z.object({
    firebase_user_id: z.string(),
    user_email: z.string().email(),
    user_name: z.string(),
})

export const userRoutes = new Hono<{ Bindings: Bindings }>()

    .post('/', zValidator('json', UserSchema), async (c) => {
        try {
            const { firebase_user_id, user_email, user_name } =
                await c.req.json()

            await c.env.DB.prepare(
                `INSERT INTO Users (firebase_user_id, user_email, user_name) VALUES (?1, ?2, ?3)`,
            )
                .bind(firebase_user_id, user_email, user_name)
                .run()

            const user = await c.env.DB.prepare(
                `SELECT * FROM Users WHERE firebase_user_id = ?1`,
            )
                .bind(firebase_user_id)
                .first<User>()

            if (!user) {
                return c.json({ error: 'User creation failed' }, 500)
            }

            return c.json(user, 201)
        } catch (err) {
            if (err instanceof z.ZodError) {
                return c.json(
                    { error: 'Invalid input', details: err.errors },
                    400,
                )
            }
            console.error('Error creating user:', err)
            return c.json({ error: 'Internal Server Error' }, 500)
        }
    })

    .get('/', async (c) => {
        try {
            const users = await c.env.DB.prepare(`SELECT * FROM Users`).all()
            return c.json(users.results, 200)
        } catch (err) {
            console.error('Error fetching users:', err)
            return c.json({ error: 'Internal Server Error' }, 500)
        }
    })

    .get('/:firebase_user_id', async (c) => {
        try {
            const firebase_user_id = c.req.param('firebase_user_id')

            const user = await c.env.DB.prepare(
                `SELECT * FROM Users WHERE firebase_user_id = ?1`,
            )
                .bind(firebase_user_id)
                .first()

            if (!user) {
                return c.json({ error: 'User not found' }, 404)
            }

            return c.json(user, 200)
        } catch (err) {
            console.error('Error fetching user:', err)
            return c.json({ error: 'Internal Server Error' }, 500)
        }
    })

    .get('/:firebase_user_id/cars', async (c) => {
        try {
            const firebase_user_id = c.req.param('firebase_user_id')

            const cars = await c.env.DB.prepare(
                `SELECT c.car_id, c.car_name, c.carmodelnum, c.car_color, c.car_mileage, c.car_isflooding, c.car_issmoked, c.car_image_url, c.created_at, c.updated_at
             FROM Cars c
             JOIN user_car uc ON c.car_id = uc.car_id
             WHERE uc.firebase_user_id = ?1`,
            )
                .bind(firebase_user_id)
                .all()

            return c.json(cars.results, 200)
        } catch (err) {
            console.error('Error fetching user cars:', err)
            return c.json({ error: 'Internal Server Error' }, 500)
        }
    })

    .put('/:firebase_user_id', zValidator('json', UserSchema), async (c) => {
        try {
            const firebase_user_id = c.req.param('firebase_user_id')
            const { user_email, user_name } = await c.req.json()

            const result = await c.env.DB.prepare(
                `UPDATE Users SET user_email = ?1, user_name = ?2 WHERE firebase_user_id = ?3`,
            )
                .bind(user_email, user_name, firebase_user_id)
                .run()

            if (result.meta.changes === 0) {
                return c.json({ error: 'User not found or not updated' }, 404)
            }

            const updatedUser = await c.env.DB.prepare(
                `SELECT * FROM Users WHERE firebase_user_id = ?1`,
            )
                .bind(firebase_user_id)
                .first()

            return c.json(updatedUser, 200)
        } catch (err) {
            console.error('Error updating user:', err)
            return c.json({ error: 'Internal Server Error' }, 500)
        }
    })

    .delete('/:firebase_user_id', async (c) => {
        try {
            const firebase_user_id = c.req.param('firebase_user_id')

            const result = await c.env.DB.prepare(
                `DELETE FROM Users WHERE firebase_user_id = ?1`,
            )
                .bind(firebase_user_id)
                .run()

            if (result.meta.changes === 0) {
                return c.json({ error: 'User not found' }, 404)
            }

            return new Response(null, { status: 204 })
        } catch (err) {
            console.error('Error deleting user:', err)
            return c.json({ error: 'Internal Server Error' }, 500)
        }
    })
