import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { Bindings } from '../index'

// **📝 車のバリデーションスキーマ**
const CreateCarRequestSchema = z.object({
    car_name: z.string(),
    carmodelnum: z.string(),
    car_color: z.string(),
    car_mileage: z.number().int(),
    car_isflooding: z.boolean(),
    car_issmoked: z.boolean(),
    car_image_url: z.string().nullable().optional(),
    firebase_user_id: z.string(),
})

// **🚗 車関連のルート定義**
export const carRoutes = new Hono<{ Bindings: Bindings }>()
    // ----------------------------------
    // 🟢 POST /api/cars
    // **📌 車を新規登録**
    // **送信するコンテンツ:**
    // {
    //   "car_name": "車の名前",
    //   "carmodelnum": "モデル番号",
    //   "car_color": "色",
    //   "car_mileage": 15000,
    //   "car_isflooding": true,
    //   "car_issmoked": false,
    //   "car_image_url": "https://example.com/image.jpg", // オプション
    //   "firebase_user_id": "user123"
    // }
    // **取得できるコンテンツ:**
    // 作成された車オブジェクト
    // ----------------------------------
    .post(
        '/',
        zValidator('json', CreateCarRequestSchema),
        async (c) => {
            try {
                const {
                    car_name,
                    carmodelnum,
                    car_color,
                    car_mileage,
                    car_isflooding,
                    car_issmoked,
                    car_image_url,
                    firebase_user_id,
                } = await c.req.json()

                // **🚀 Cars テーブルに車情報を追加**
                const insertCarStmt = await c.env.DB.prepare(
                    `INSERT INTO Cars (car_name, carmodelnum, car_color, car_mileage, car_isflooding, car_issmoked, car_image_url) 
                     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7) RETURNING car_id`
                )
                    .bind(
                        car_name,
                        carmodelnum,
                        car_color,
                        car_mileage,
                        car_isflooding ? 1 : 0,
                        car_issmoked ? 1 : 0,
                        car_image_url || null
                    )
                    .run()

                // **🚀 挿入された car_id を取得**
                const car_id = insertCarStmt.meta.last_row_id
                if (!car_id) {
                    return c.json({ error: 'Failed to insert car' }, 500)
                }

                // **👤 ユーザーと車を紐づけ**
                await c.env.DB.prepare(
                    `INSERT INTO user_car (firebase_user_id, car_id) VALUES (?1, ?2)`
                )
                    .bind(firebase_user_id, car_id)
                    .run()

                // **🎯 作成された車情報を取得**
                const car = await c.env.DB.prepare(
                    `SELECT * FROM Cars WHERE car_id = ?1`
                )
                    .bind(car_id)
                    .first()

                return c.json(car, 201)
            } catch (err) {
                if (err instanceof z.ZodError) {
                    return c.json(
                        { error: 'Invalid input', details: err.errors },
                        400
                    )
                }
                console.error('Error creating car:', err)
                return c.json({ error: 'Internal Server Error' }, 500)
            }
        }
    )

    // ----------------------------------
    // 🟢 GET /api/cars
    // **📌 全ての車を取得**
    // **送信するコンテンツ:**
    // なし
    // **取得できるコンテンツ:**
    // 車オブジェクトの配列
    // ----------------------------------
    .get('/', async (c) => {
        try {
            const cars = await c.env.DB.prepare(`SELECT * FROM Cars`).all()
            return c.json(cars.results, 200)
        } catch (err) {
            console.error('Error fetching cars:', err)
            return c.json({ error: 'Internal Server Error' }, 500)
        }
    })

    // ----------------------------------
    // 🟢 GET /api/cars/:car_id
    // **📌 特定の車を取得**
    // **送信するコンテンツ:**
    // なし
    // **取得できるコンテンツ:**
    // 指定された `car_id` の車オブジェクト
    // ----------------------------------
    .get('/:car_id', async (c) => {
        try {
            const car_id = parseInt(c.req.param('car_id'), 10)
            if (isNaN(car_id)) {
                return c.json({ error: 'Invalid car_id' }, 400)
            }

            const car = await c.env.DB.prepare(
                `SELECT * FROM Cars WHERE car_id = ?1`
            )
                .bind(car_id)
                .first()

            if (!car) {
                return c.json({ error: 'Car not found' }, 404)
            }

            return c.json(car, 200)
        } catch (err) {
            console.error('Error fetching car:', err)
            return c.json({ error: 'Internal Server Error' }, 500)
        }
    })

    // ----------------------------------
    // 🟢 DELETE /api/cars/:car_id
    // **📌 特定の車を削除**
    // **送信するコンテンツ:**
    // なし
    // **取得できるコンテンツ:**
    // なし (204 No Content)
    // ----------------------------------
    .delete('/:car_id', async (c) => {
        try {
            const car_id = parseInt(c.req.param('car_id'), 10)
            if (isNaN(car_id)) {
                return c.json({ error: 'Invalid car_id' }, 400)
            }

            // **🛠 関連データの削除**
            const tables = [
                'FuelEfficiencies',
                'Maintenances',
                'Tunings',
                'Accidents',
                'PeriodicInspection',
                'user_car',
            ]

            for (const table of tables) {
                await c.env.DB.prepare(
                    `DELETE FROM ${table} WHERE car_id = ?1`
                ).bind(car_id).run()
            }

            // **🚗 Cars テーブルから車を削除**
            const result = await c.env.DB.prepare(
                `DELETE FROM Cars WHERE car_id = ?1`
            )
                .bind(car_id)
                .run()

            if (result.meta.changes === 0) {
                return c.json({ error: 'Car not found' }, 404)
            }

            return new Response(null, { status: 204 }) // ✅ 204 No Content
        } catch (err) {
            console.error('Error deleting car:', err)
            return c.json({ error: 'Internal Server Error' }, 500)
        }
    })

    // ----------------------------------
    // 🟢 PUT /api/cars/:car_id/image
    // **📌 車の画像を更新**
    // **送信するコンテンツ:**
    // {
    //   "car_image_url": "https://example.com/new-image.jpg"
    // }
    // **取得できるコンテンツ:**
    // 成功メッセージ
    // ----------------------------------
    .put('/:car_id/image', async (c) => {
        try {
            const car_id = parseInt(c.req.param('car_id'), 10)
            if (isNaN(car_id)) {
                return c.json({ error: 'Invalid car_id' }, 400)
            }

            const { car_image_url } = await c.req.json()

            // **🛠 Cars テーブルの car_image_url を更新**
            await c.env.DB.prepare(
                `UPDATE Cars SET car_image_url = ?1 WHERE car_id = ?2`
            )
                .bind(car_image_url || null, car_id)
                .run()

            return c.json({ message: 'Car image updated successfully' }, 200)
        } catch (err) {
            console.error('Error updating car image:', err)
            return c.json({ error: 'Internal Server Error' }, 500)
        }
    })

export default carRoutes
