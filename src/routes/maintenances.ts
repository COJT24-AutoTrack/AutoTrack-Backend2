import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { Bindings } from '../index'

// **📝 メンテナンスのバリデーションスキーマ**
const MaintenanceSchema = z.object({
    car_id: z.number().int(),
    maint_type: z.string(),
    maint_title: z.string().optional(),
    maint_date: z.string().datetime(),
    maint_description: z.string(),
})

// **🛠 メンテナンスデータの処理ロジック**
const applyMaintenanceLogic = (
    maintenance: z.infer<typeof MaintenanceSchema>,
) => {
    return {
        ...maintenance,
        maint_title: maintenance.maint_title,
    }
}

// **🚗 メンテナンス関連のルート定義**
export const maintenancesRoutes = new Hono<{ Bindings: Bindings }>()
    // ----------------------------------
    // 🟢 POST /api/maintenances
    // **📌 メンテナンスを新規作成**
    // **送信するコンテンツ:**
    // {
    //   "car_id": number,
    //   "maint_type": "OilChange" | "TireRotation" | "BrakeInspection" | "Other",
    //   "maint_title": "任意のタイトル", // maint_type が 'Other' の場合のみ必要
    //   "maint_date": "YYYY-MM-DDTHH:MM:SSZ", // ISO 8601形式
    //   "maint_description": "メンテナンスの詳細説明"
    // }
    // **取得できるコンテンツ:**
    // 作成されたメンテナンスオブジェクト
    // ----------------------------------
    .post('/', zValidator('json', MaintenanceSchema), async (c) => {
        try {
            const maintenanceData = applyMaintenanceLogic(await c.req.json())

            // **🚀 Maintenances テーブルにメンテナンス情報を追加**
            const insertStmt = await c.env.DB.prepare(
                `INSERT INTO Maintenances (car_id, maint_type, maint_title, maint_date, maint_description) VALUES (?1, ?2, ?3, ?4, ?5) RETURNING maint_id`,
            )
                .bind(
                    maintenanceData.car_id,
                    maintenanceData.maint_type,
                    maintenanceData.maint_title,
                    maintenanceData.maint_date,
                    maintenanceData.maint_description,
                )
                .run()

            // **🚀 挿入された maint_id を取得**
            const maint_id = insertStmt.meta.last_row_id
            if (!maint_id) {
                return c.json({ error: 'Failed to insert maintenance' }, 500)
            }

            // **🎯 作成されたメンテナンス情報を取得**
            const maintenance = await c.env.DB.prepare(
                `SELECT * FROM Maintenances WHERE maint_id = ?1`,
            )
                .bind(maint_id)
                .first()

            return c.json(maintenance, 201)
        } catch (err) {
            if (err instanceof z.ZodError) {
                return c.json(
                    { error: 'Invalid input', details: err.errors },
                    400,
                )
            }
            console.error('Error creating maintenance:', err)
            return c.json({ error: 'Internal Server Error' }, 500)
        }
    })

    // ----------------------------------
    // 🟢 GET /api/maintenances
    // **📌 全てのメンテナンスを取得**
    // **送信するコンテンツ:**
    // なし
    // **取得できるコンテンツ:**
    // メンテナンスオブジェクトの配列
    // ----------------------------------
    .get('/', async (c) => {
        try {
            const maintenances = await c.env.DB.prepare(
                `SELECT * FROM Maintenances`,
            ).all()
            return c.json(maintenances.results, 200)
        } catch (err) {
            console.error('Error fetching maintenances:', err)
            return c.json({ error: 'Internal Server Error' }, 500)
        }
    })

    // ----------------------------------
    // 🟢 GET /api/maintenances/:maint_id
    // **📌 特定のメンテナンスを取得**
    // **送信するコンテンツ:**
    // なし
    // **取得できるコンテンツ:**
    // 指定された `maint_id` のメンテナンスオブジェクト
    // ----------------------------------
    .get('/:maint_id', async (c) => {
        try {
            const maint_id = parseInt(c.req.param('maint_id'), 10)
            if (isNaN(maint_id)) {
                return c.json({ error: 'Invalid maint_id' }, 400)
            }

            // **🔍 Maintenances テーブルから指定されたメンテナンスを取得**
            const maintenance = await c.env.DB.prepare(
                `SELECT * FROM Maintenances WHERE maint_id = ?1`,
            )
                .bind(maint_id)
                .first()

            if (!maintenance) {
                return c.json({ error: 'Maintenance not found' }, 404)
            }

            return c.json(maintenance, 200)
        } catch (err) {
            console.error('Error fetching maintenance:', err)
            return c.json({ error: 'Internal Server Error' }, 500)
        }
    })

    // ----------------------------------
    // 🟢 PUT /api/maintenances/:maint_id
    // **📌 特定のメンテナンス情報を更新**
    // **送信するコンテンツ:**
    // {
    //   "car_id": number,
    //   "maint_type": "OilChange" | "TireRotation" | "BrakeInspection" | "Other",
    //   "maint_title": "任意のタイトル", // maint_type が 'Other' の場合のみ必要
    //   "maint_date": "YYYY-MM-DDTHH:MM:SSZ", // ISO 8601形式
    //   "maint_description": "更新されたメンテナンスの詳細説明"
    // }
    // **取得できるコンテンツ:**
    // 更新されたメンテナンスオブジェクト
    // ----------------------------------
    .put('/:maint_id', zValidator('json', MaintenanceSchema), async (c) => {
        try {
            const maint_id = parseInt(c.req.param('maint_id'), 10)
            if (isNaN(maint_id)) {
                return c.json({ error: 'Invalid maint_id' }, 400)
            }

            const maintenanceData = applyMaintenanceLogic(await c.req.json())

            // **🛠 Maintenances テーブルのメンテナンス情報を更新**
            const result = await c.env.DB.prepare(
                `UPDATE Maintenances SET car_id = ?1, maint_type = ?2, maint_title = ?3, maint_date = ?4, maint_description = ?5 WHERE maint_id = ?6`,
            )
                .bind(
                    maintenanceData.car_id,
                    maintenanceData.maint_type,
                    maintenanceData.maint_title,
                    maintenanceData.maint_date,
                    maintenanceData.maint_description,
                    maint_id,
                )
                .run()

            if (result.meta.changes === 0) {
                return c.json(
                    { error: 'Maintenance not found or not updated' },
                    404,
                )
            }

            // **🎯 更新後のメンテナンス情報を取得**
            const updatedMaintenance = await c.env.DB.prepare(
                `SELECT * FROM Maintenances WHERE maint_id = ?1`,
            )
                .bind(maint_id)
                .first()

            return c.json(updatedMaintenance, 200)
        } catch (err) {
            console.error('Error updating maintenance:', err)
            return c.json({ error: 'Internal Server Error' }, 500)
        }
    })

    // ----------------------------------
    // 🟢 DELETE /api/maintenances/:maint_id
    // **📌 特定のメンテナンスを削除**
    // **送信するコンテンツ:**
    // なし
    // **取得できるコンテンツ:**
    // なし (204 No Content)
    // ----------------------------------
    .delete('/:maint_id', async (c) => {
        try {
            const maint_id = parseInt(c.req.param('maint_id'), 10)
            if (isNaN(maint_id)) {
                return c.json({ error: 'Invalid maint_id' }, 400)
            }

            // **🛠 Maintenances テーブルからメンテナンスを削除**
            const result = await c.env.DB.prepare(
                `DELETE FROM Maintenances WHERE maint_id = ?1`,
            )
                .bind(maint_id)
                .run()

            if (result.meta.changes === 0) {
                return c.json({ error: 'Maintenance not found' }, 404)
            }

            return new Response(null, { status: 204 }) // ✅ 204 No Content
        } catch (err) {
            console.error('Error deleting maintenance:', err)
            return c.json({ error: 'Internal Server Error' }, 500)
        }
    })

export default maintenancesRoutes
