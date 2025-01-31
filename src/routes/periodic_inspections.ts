import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { Bindings } from '../index'

// **📝 定期点検のバリデーションスキーマ**
const PeriodicInspectionSchema = z.object({
    car_id: z.number().int(),
    pi_name: z.string(),
    pi_date: z.string().datetime(),
    pi_nextdate: z.string().datetime(),
})

// **🚗 定期点検関連のルート定義**
export const periodicInspectionsRoutes = new Hono<{ Bindings: Bindings }>()

    // ----------------------------------
    // 🟢 POST /api/periodicInspections
    // **📌 定期点検を新規作成**
    // **送信するコンテンツ:**
    // {
    //   "car_id": number,
    //   "pi_name": "点検名",
    //   "pi_date": "YYYY-MM-DDTHH:MM:SSZ",       // ISO 8601形式
    //   "pi_nextdate": "YYYY-MM-DDTHH:MM:SSZ"   // 次回点検予定日（ISO 8601形式）
    // }
    // **取得できるコンテンツ:**
    // 作成された定期点検オブジェクト
    // ----------------------------------
    .post('/', zValidator('json', PeriodicInspectionSchema), async (c) => {
        try {
            const { car_id, pi_name, pi_date, pi_nextdate } = await c.req.json()

            // **🚀 PeriodicInspection テーブルに定期点検情報を追加**
            const insertStmt = await c.env.DB.prepare(
                `INSERT INTO PeriodicInspection (car_id, pi_name, pi_date, pi_nextdate) 
                 VALUES (?1, ?2, ?3, ?4) RETURNING pi_id`,
            )
                .bind(car_id, pi_name, pi_date, pi_nextdate)
                .run()

            // **🚀 挿入された pi_id を取得**
            const pi_id = insertStmt.meta.last_row_id
            if (!pi_id) {
                return c.json(
                    { error: 'Failed to insert periodic inspection' },
                    500,
                )
            }

            // **🎯 作成された定期点検情報を取得**
            const periodicInspection = await c.env.DB.prepare(
                `SELECT * FROM PeriodicInspection WHERE pi_id = ?1`,
            )
                .bind(pi_id)
                .first()

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

    // ----------------------------------
    // 🟢 GET /api/periodicInspections
    // **📌 全ての定期点検を取得**
    // **送信するコンテンツ:**
    // なし
    // **取得できるコンテンツ:**
    // 定期点検オブジェクトの配列
    // ----------------------------------
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

    // ----------------------------------
    // 🟢 GET /api/periodicInspections/:pi_id
    // **📌 特定の定期点検を取得**
    // **送信するコンテンツ:**
    // なし
    // **取得できるコンテンツ:**
    // 指定された `pi_id` の定期点検オブジェクト
    // ----------------------------------
    .get('/:pi_id', async (c) => {
        try {
            const pi_id = parseInt(c.req.param('pi_id'), 10)
            if (isNaN(pi_id)) {
                return c.json({ error: 'Invalid pi_id' }, 400)
            }

            // **🔍 PeriodicInspection テーブルから指定された定期点検を取得**
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

    // ----------------------------------
    // 🟢 PUT /api/periodicInspections/:pi_id
    // **📌 特定の定期点検情報を更新**
    // **送信するコンテンツ:**
    // {
    //   "car_id": number,
    //   "pi_name": "更新された点検名",
    //   "pi_date": "YYYY-MM-DDTHH:MM:SSZ",       // ISO 8601形式
    //   "pi_nextdate": "YYYY-MM-DDTHH:MM:SSZ"   // 次回点検予定日（ISO 8601形式）
    // }
    // **取得できるコンテンツ:**
    // 更新された定期点検オブジェクト
    // ----------------------------------
    .put('/:pi_id', zValidator('json', PeriodicInspectionSchema), async (c) => {
        try {
            const pi_id = parseInt(c.req.param('pi_id'), 10)
            if (isNaN(pi_id)) {
                return c.json({ error: 'Invalid pi_id' }, 400)
            }

            const { car_id, pi_name, pi_date, pi_nextdate } = await c.req.json()

            // **🛠 PeriodicInspection テーブルの定期点検情報を更新**
            const result = await c.env.DB.prepare(
                `UPDATE PeriodicInspection 
                 SET car_id = ?1, pi_name = ?2, pi_date = ?3, pi_nextdate = ?4 
                 WHERE pi_id = ?5`,
            )
                .bind(car_id, pi_name, pi_date, pi_nextdate, pi_id)
                .run()

            if (result.meta.changes === 0) {
                return c.json(
                    { error: 'Periodic inspection not found or not updated' },
                    404,
                )
            }

            // **🎯 更新後の定期点検情報を取得**
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

    // ----------------------------------
    // 🟢 DELETE /api/periodicInspections/:pi_id
    // **📌 特定の定期点検を削除**
    // **送信するコンテンツ:**
    // なし
    // **取得できるコンテンツ:**
    // なし (204 No Content)
    // ----------------------------------
    .delete('/:pi_id', async (c) => {
        try {
            const pi_id = parseInt(c.req.param('pi_id'), 10)
            if (isNaN(pi_id)) {
                return c.json({ error: 'Invalid pi_id' }, 400)
            }

            // **🛠 PeriodicInspection テーブルから定期点検を削除**
            const result = await c.env.DB.prepare(
                `DELETE FROM PeriodicInspection WHERE pi_id = ?1`,
            )
                .bind(pi_id)
                .run()

            if (result.meta.changes === 0) {
                return c.json({ error: 'Periodic inspection not found' }, 404)
            }

            return new Response(null, { status: 204 }) // ✅ 204 No Content
        } catch (err) {
            console.error('Error deleting periodic inspection:', err)
            return c.json({ error: 'Internal Server Error' }, 500)
        }
    })

export default periodicInspectionsRoutes
