import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { Bindings } from '../index'

// **📝 事故のバリデーションスキーマ**
const AccidentSchema = z.object({
    car_id: z.number().int(),
    accident_date: z.string().datetime(),
    accident_description: z.string(),
})

// **🚗 事故関連のルート定義**
export const accidentsRoutes = new Hono<{ Bindings: Bindings }>()
    // ----------------------------------
    // 🟢 POST /api/accidents
    // **📌 事故を新規作成**
    // **送信するコンテンツ:**
    // {
    //   "car_id": number,
    //   "accident_date": "YYYY-MM-DDTHH:MM:SSZ", // ISO 8601形式
    //   "accident_description": "事故の詳細説明"
    // }
    // **取得できるコンテンツ:**
    // 作成された事故オブジェクト
    // ----------------------------------
    .post(
        '/',
        zValidator('json', AccidentSchema),
        async (c) => {
            try {
                const { car_id, accident_date, accident_description } = await c.req.json()

                // **🚀 Accidents テーブルに事故情報を追加**
                const insertStmt = await c.env.DB.prepare(
                    `INSERT INTO Accidents (car_id, accident_date, accident_description) VALUES (?1, ?2, ?3) RETURNING accident_id`
                )
                    .bind(car_id, accident_date, accident_description)
                    .run()

                // **🚀 挿入された accident_id を取得**
                const accident_id = insertStmt.meta.last_row_id
                if (!accident_id) {
                    return c.json({ error: 'Failed to insert accident' }, 500)
                }

                // **🎯 作成された事故情報を取得**
                const accident = await c.env.DB.prepare(
                    `SELECT * FROM Accidents WHERE accident_id = ?1`
                )
                    .bind(accident_id)
                    .first()

                return c.json(accident, 201)
            } catch (err) {
                if (err instanceof z.ZodError) {
                    return c.json({ error: 'Invalid input', details: err.errors }, 400)
                }
                console.error('Error creating accident:', err)
                return c.json({ error: 'Internal Server Error' }, 500)
            }
        }
    )

    // ----------------------------------
    // 🟢 GET /api/accidents
    // **📌 全ての事故を取得**
    // **送信するコンテンツ:**
    // なし
    // **取得できるコンテンツ:**
    // 事故オブジェクトの配列
    // ----------------------------------
    .get('/', async (c) => {
        try {
            const accidents = await c.env.DB.prepare(`SELECT * FROM Accidents`).all()
            return c.json(accidents.results, 200)
        } catch (err) {
            console.error('Error fetching accidents:', err)
            return c.json({ error: 'Internal Server Error' }, 500)
        }
    })

    // ----------------------------------
    // 🟢 GET /api/accidents/:accident_id
    // **📌 特定の事故を取得**
    // **送信するコンテンツ:**
    // なし
    // **取得できるコンテンツ:**
    // 指定された `accident_id` の事故オブジェクト
    // ----------------------------------
    .get('/:accident_id', async (c) => {
        try {
            const accident_id = parseInt(c.req.param('accident_id'), 10)
            if (isNaN(accident_id)) {
                return c.json({ error: 'Invalid accident_id' }, 400)
            }

            // **🔍 Accidents テーブルから指定された事故を取得**
            const accident = await c.env.DB.prepare(
                `SELECT * FROM Accidents WHERE accident_id = ?1`
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

    // ----------------------------------
    // 🟢 PUT /api/accidents/:accident_id
    // **📌 特定の事故情報を更新**
    // **送信するコンテンツ:**
    // {
    //   "car_id": number,
    //   "accident_date": "YYYY-MM-DDTHH:MM:SSZ", // ISO 8601形式
    //   "accident_description": "更新された事故の詳細説明"
    // }
    // **取得できるコンテンツ:**
    // 更新された事故オブジェクト
    // ----------------------------------
    .put(
        '/:accident_id',
        zValidator('json', AccidentSchema),
        async (c) => {
            try {
                const accident_id = parseInt(c.req.param('accident_id'), 10)
                if (isNaN(accident_id)) {
                    return c.json({ error: 'Invalid accident_id' }, 400)
                }

                const { car_id, accident_date, accident_description } = await c.req.json()

                // **🛠 Accidents テーブルの事故情報を更新**
                const result = await c.env.DB.prepare(
                    `UPDATE Accidents SET car_id = ?1, accident_date = ?2, accident_description = ?3 WHERE accident_id = ?4`
                )
                    .bind(car_id, accident_date, accident_description, accident_id)
                    .run()

                if (result.meta.changes === 0) {
                    return c.json({ error: 'Accident not found or not updated' }, 404)
                }

                // **🎯 更新後の事故情報を取得**
                const updatedAccident = await c.env.DB.prepare(
                    `SELECT * FROM Accidents WHERE accident_id = ?1`
                )
                    .bind(accident_id)
                    .first()

                return c.json(updatedAccident, 200)
            } catch (err) {
                console.error('Error updating accident:', err)
                return c.json({ error: 'Internal Server Error' }, 500)
            }
        }
    )

    // ----------------------------------
    // 🟢 DELETE /api/accidents/:accident_id
    // **📌 特定の事故を削除**
    // **送信するコンテンツ:**
    // なし
    // **取得できるコンテンツ:**
    // なし (204 No Content)
    // ----------------------------------
    .delete('/:accident_id', async (c) => {
        try {
            const accident_id = parseInt(c.req.param('accident_id'), 10)
            if (isNaN(accident_id)) {
                return c.json({ error: 'Invalid accident_id' }, 400)
            }

            // **🛠 Accidents テーブルから事故を削除**
            const result = await c.env.DB.prepare(
                `DELETE FROM Accidents WHERE accident_id = ?1`
            )
                .bind(accident_id)
                .run()

            if (result.meta.changes === 0) {
                return c.json({ error: 'Accident not found' }, 404)
            }

            return new Response(null, { status: 204 }) // ✅ 204 No Content
        } catch (err) {
            console.error('Error deleting accident:', err)
            return c.json({ error: 'Internal Server Error' }, 500)
        }
    })

export default accidentsRoutes
