import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { Bindings } from '../index'

// **📝 燃費データのバリデーションスキーマ**
const FuelEfficiencySchema = z.object({
    car_id: z.number().int(),
    fe_date: z.string().datetime(),
    fe_amount: z.number().positive(),
    fe_unitprice: z.number().positive(),
    fe_mileage: z.number().positive(),
})

// **🚗 燃費関連のルート定義**
export const fuelEfficiencyRoutes = new Hono<{ Bindings: Bindings }>()

    // ----------------------------------
    // 🟢 POST /api/fuelEfficiencies
    // **📌 燃費データを新規作成**
    // **送信するコンテンツ:**
    // {
    //   "car_id": number,
    //   "fe_date": "YYYY-MM-DDTHH:MM:SSZ",     // ISO 8601形式
    //   "fe_amount": number,                   // 燃料の量（リットルなど）
    //   "fe_unitprice": number,                // 燃料の単価
    //   "fe_mileage": number                   // 燃費（km/Lなど）
    // }
    // **取得できるコンテンツ:**
    // 作成された燃費オブジェクト
    // ----------------------------------
    .post(
        '/',
        zValidator('json', FuelEfficiencySchema),
        async (c) => {
            try {
                const { car_id, fe_date, fe_amount, fe_unitprice, fe_mileage } = await c.req.json()

                // **🚀 FuelEfficiencies テーブルに燃費情報を追加**
                const insertStmt = await c.env.DB.prepare(
                    `INSERT INTO FuelEfficiencies (car_id, fe_date, fe_amount, fe_unitprice, fe_mileage) VALUES (?1, ?2, ?3, ?4, ?5) RETURNING fe_id`
                )
                    .bind(car_id, fe_date, fe_amount, fe_unitprice, fe_mileage)
                    .run()

                // **🚀 挿入された fe_id を取得**
                const fe_id = insertStmt.meta.last_row_id
                if (!fe_id) {
                    return c.json({ error: 'Failed to insert fuel efficiency' }, 500)
                }

                // **🎯 作成された燃費情報を取得**
                const fuelEfficiency = await c.env.DB.prepare(
                    `SELECT * FROM FuelEfficiencies WHERE fe_id = ?1`
                )
                    .bind(fe_id)
                    .first()

                return c.json(fuelEfficiency, 201)
            } catch (err) {
                if (err instanceof z.ZodError) {
                    // **⚠️ 入力バリデーションエラーを返す**
                    return c.json(
                        { error: 'Invalid input', details: err.errors },
                        400,
                    )
                }
                // **❌ その他のエラーを返す**
                console.error('Error creating fuel efficiency:', err)
                return c.json({ error: 'Internal Server Error' }, 500)
            }
        }
    )

    // ----------------------------------
    // 🟢 GET /api/fuelEfficiencies
    // **📌 全ての燃費データを取得**
    // **送信するコンテンツ:**
    // なし
    // **取得できるコンテンツ:**
    // 燃費オブジェクトの配列
    // ----------------------------------
    .get('/', async (c) => {
        try {
            // **🔍 FuelEfficiencies テーブルから全ての燃費データを取得**
            const fuelEfficiencies = await c.env.DB.prepare(
                `SELECT * FROM FuelEfficiencies`
            ).all()
            return c.json(fuelEfficiencies.results, 200)
        } catch (err) {
            // **❌ エラー発生時に内部サーバーエラーを返す**
            console.error('Error fetching fuel efficiencies:', err)
            return c.json({ error: 'Internal Server Error' }, 500)
        }
    })

    // ----------------------------------
    // 🟢 GET /api/fuelEfficiencies/:fe_id
    // **📌 特定の燃費データを取得**
    // **送信するコンテンツ:**
    // なし
    // **取得できるコンテンツ:**
    // 指定された `fe_id` の燃費オブジェクト
    // ----------------------------------
    .get('/:fe_id', async (c) => {
        try {
            const fe_id = parseInt(c.req.param('fe_id'), 10)
            if (isNaN(fe_id)) {
                // **⚠️ 無効な fe_id の場合、400エラーを返す**
                return c.json({ error: 'Invalid fe_id' }, 400)
            }

            // **🔍 FuelEfficiencies テーブルから指定された燃費データを取得**
            const fuelEfficiency = await c.env.DB.prepare(
                `SELECT * FROM FuelEfficiencies WHERE fe_id = ?1`
            )
                .bind(fe_id)
                .first()

            if (!fuelEfficiency) {
                // **❌ 燃費データが見つからない場合、404エラーを返す**
                return c.json({ error: 'Fuel efficiency record not found' }, 404)
            }

            // **✅ 燃費データを返す**
            return c.json(fuelEfficiency, 200)
        } catch (err) {
            // **❌ エラー発生時に内部サーバーエラーを返す**
            console.error('Error fetching fuel efficiency:', err)
            return c.json({ error: 'Internal Server Error' }, 500)
        }
    })

    // ----------------------------------
    // 🟢 PUT /api/fuelEfficiencies/:fe_id
    // **📌 特定の燃費データを更新**
    // **送信するコンテンツ:**
    // {
    //   "car_id": number,
    //   "fe_date": "YYYY-MM-DDTHH:MM:SSZ",     // ISO 8601形式
    //   "fe_amount": number,                   // 燃料の量（リットルなど）
    //   "fe_unitprice": number,                // 燃料の単価
    //   "fe_mileage": number                   // 燃費（km/Lなど）
    // }
    // **取得できるコンテンツ:**
    // 更新された燃費オブジェクト
    // ----------------------------------
    .put(
        '/:fe_id',
        zValidator('json', FuelEfficiencySchema),
        async (c) => {
            try {
                const fe_id = parseInt(c.req.param('fe_id'), 10)
                if (isNaN(fe_id)) {
                    // **⚠️ 無効な fe_id の場合、400エラーを返す**
                    return c.json({ error: 'Invalid fe_id' }, 400)
                }

                const { car_id, fe_date, fe_amount, fe_unitprice, fe_mileage } = await c.req.json()

                // **🛠 FuelEfficiencies テーブルの燃費データを更新**
                const result = await c.env.DB.prepare(
                    `UPDATE FuelEfficiencies SET car_id = ?1, fe_date = ?2, fe_amount = ?3, fe_unitprice = ?4, fe_mileage = ?5 WHERE fe_id = ?6`
                )
                    .bind(car_id, fe_date, fe_amount, fe_unitprice, fe_mileage, fe_id)
                    .run()

                if (result.meta.changes === 0) {
                    // **❌ 燃費データが見つからない、または更新されなかった場合、404エラーを返す**
                    return c.json({ error: 'Fuel efficiency not found or not updated' }, 404)
                }

                // **🎯 更新後の燃費データを取得**
                const updatedFuelEfficiency = await c.env.DB.prepare(
                    `SELECT * FROM FuelEfficiencies WHERE fe_id = ?1`
                )
                    .bind(fe_id)
                    .first()

                // **✅ 更新された燃費データを返す**
                return c.json(updatedFuelEfficiency, 200)
            } catch (err) {
                if (err instanceof z.ZodError) {
                    // **⚠️ 入力バリデーションエラーを返す**
                    return c.json(
                        { error: 'Invalid input', details: err.errors },
                        400,
                    )
                }
                // **❌ その他のエラーを返す**
                console.error('Error updating fuel efficiency:', err)
                return c.json({ error: 'Internal Server Error' }, 500)
            }
        }
    )

    // ----------------------------------
    // 🟢 DELETE /api/fuelEfficiencies/:fe_id
    // **📌 特定の燃費データを削除**
    // **送信するコンテンツ:**
    // なし
    // **取得できるコンテンツ:**
    // なし (204 No Content)
    // ----------------------------------
    .delete('/:fe_id', async (c) => {
        try {
            const fe_id = parseInt(c.req.param('fe_id'), 10)
            if (isNaN(fe_id)) {
                // **⚠️ 無効な fe_id の場合、400エラーを返す**
                return c.json({ error: 'Invalid fe_id' }, 400)
            }

            // **🛠 FuelEfficiencies テーブルから燃費データを削除**
            const result = await c.env.DB.prepare(
                `DELETE FROM FuelEfficiencies WHERE fe_id = ?1`
            )
                .bind(fe_id)
                .run()

            if (result.meta.changes === 0) {
                // **❌ 燃費データが見つからない場合、404エラーを返す**
                return c.json({ error: 'Fuel efficiency record not found' }, 404)
            }

            // **✅ 燃費データ削除成功時に204 No Contentを返す**
            return new Response(null, { status: 204 })
        } catch (err) {
            // **❌ エラー発生時に内部サーバーエラーを返す**
            console.error('Error deleting fuel efficiency:', err)
            return c.json({ error: 'Internal Server Error' }, 500)
        }
    })

export default fuelEfficiencyRoutes
