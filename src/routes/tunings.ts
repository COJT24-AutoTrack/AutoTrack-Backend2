import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { Bindings } from '../index'

// **📝 チューニングのバリデーションスキーマ**
const CreateTuningRequestSchema = z.object({
    tuning_id: z.number().int().optional(), // Optional because it's auto-generated
    tuning_name: z.string(),
    tuning_price: z.number().int(),
    tuning_image_url: z.string().nullable().optional(), // Nullable for Option<String>
    created_at: z.string().datetime().optional(), // Optional because it's auto-generated
    updated_at: z.string().datetime().optional(),
    firebase_user_id: z.string(),
})

// **🚗 チューニング関連のルート定義**
export const tuningRoutes = new Hono<{ Bindings: Bindings }>()
    // ----------------------------------
    // 🟢 POST /api/tunings
    // **📌 チューニングを新規作成**
    // **送信するコンテンツ:**
    // {
    //   "tuning_name": "Performance Upgrade",
    //   "tuning_price": 50000,
    //   "tuning_image_url": "https://example.com/tuning.jpg", // オプション
    //   "firebase_user_id": "user123"
    // }
    // **取得できるコンテンツ:**
    // {
    //   "status": "new_tuning"
    // }
    // **⚠️ 注意:**
    // `firebase_user_id` がチューニングに関連付けられていないため、必要に応じて関連付けのロジックを追加してください。
    // ----------------------------------
    .post(
        '/',
        zValidator('json', CreateTuningRequestSchema),
        async (c) => {
            try {
                const { tuning_name, tuning_price, tuning_image_url } =
                    CreateTuningRequestSchema.parse(await c.req.json())

                // **🚀 Tunings テーブルにチューニング情報を追加**
                await c.env.DB.prepare(
                    `INSERT INTO Tunings (tuning_name, tuning_price, tuning_image_url) VALUES (?1, ?2, ?3)`,
                )
                    .bind(tuning_name, tuning_price, tuning_image_url || null)
                    .run()

                // **✅ 新規チューニング作成のステータスを返す**
                return c.json({ status: 'new_tuning' }, 201)
            } catch (err) {
                if (err instanceof z.ZodError) {
                    // **⚠️ 入力バリデーションエラーを返す**
                    return c.json(
                        { error: 'Invalid input', details: err.errors },
                        400,
                    )
                }
                // **❌ その他のエラーを返す**
                console.error('Error creating tuning:', err)
                return c.json({ error: 'Internal Server Error' }, 500)
            }
        },
    )

    // ----------------------------------
    // 🟢 GET /api/tunings
    // **📌 全てのチューニングを取得**
    // **送信するコンテンツ:**
    // なし
    // **取得できるコンテンツ:**
    // [
    //   {
    //     "tuning_id": 1,
    //     "tuning_name": "Performance Upgrade",
    //     "tuning_price": 50000,
    //     "tuning_image_url": "https://example.com/tuning.jpg",
    //     "created_at": "2024-01-01T10:00:00Z",
    //     "updated_at": "2024-01-01T10:00:00Z",
    //     "firebase_user_id": "user123"
    //   },
    //   ...
    // ]
    // ----------------------------------
    .get('/', async (c) => {
        try {
            // **🔍 Tunings テーブルから全てのチューニングを取得**
            const tunings = await c.env.DB.prepare(`SELECT * FROM Tunings`).all()
            return c.json(tunings.results, 200)
        } catch (err) {
            // **❌ エラー発生時に内部サーバーエラーを返す**
            console.error('Error fetching tunings:', err)
            return c.json({ error: 'Internal Server Error' }, 500)
        }
    })

    // ----------------------------------
    // 🟢 GET /api/tunings/:tuning_id
    // **📌 特定のチューニングを取得**
    // **送信するコンテンツ:**
    // なし
    // **取得できるコンテンツ:**
    // {
    //   "tuning_id": 1,
    //   "tuning_name": "Performance Upgrade",
    //   "tuning_price": 50000,
    //   "tuning_image_url": "https://example.com/tuning.jpg",
    //   "created_at": "2024-01-01T10:00:00Z",
    //   "updated_at": "2024-01-01T10:00:00Z",
    //   "firebase_user_id": "user123"
    // }
    // ----------------------------------
    .get('/:tuning_id', async (c) => {
        try {
            const tuning_id = parseInt(c.req.param('tuning_id'), 10)
            if (isNaN(tuning_id)) {
                // **⚠️ 無効な tuning_id の場合、400エラーを返す**
                return c.json({ error: 'Invalid tuning_id' }, 400)
            }

            // **🔍 Tunings テーブルから指定されたチューニングを取得**
            const tuning = await c.env.DB.prepare(
                `SELECT * FROM Tunings WHERE tuning_id = ?1`
            )
                .bind(tuning_id)
                .first()

            if (!tuning) {
                // **❌ チューニングが見つからない場合、404エラーを返す**
                return c.json({ error: 'Tuning not found' }, 404)
            }

            // **✅ チューニング情報を返す**
            return c.json(tuning, 200)
        } catch (err) {
            // **❌ エラー発生時に内部サーバーエラーを返す**
            console.error('Error fetching tuning:', err)
            return c.json({ error: 'Internal Server Error' }, 500)
        }
    })

    // ----------------------------------
    // 🟢 PUT /api/tunings/:tuning_id
    // **📌 特定のチューニング情報を更新**
    // **送信するコンテンツ:**
    // {
    //   "tuning_name": "Updated Performance Upgrade",
    //   "tuning_price": 55000,
    //   "tuning_image_url": "https://example.com/updated-tuning.jpg", // オプション
    //   "firebase_user_id": "user123" // 必要に応じて関連付け
    // }
    // **取得できるコンテンツ:**
    // 更新されたチューニングオブジェクト
    // ----------------------------------
    .put('/:tuning_id', zValidator('json', CreateTuningRequestSchema), async (c) => {
        try {
            const tuning_id = parseInt(c.req.param('tuning_id'), 10)
            if (isNaN(tuning_id)) {
                // **⚠️ 無効な tuning_id の場合、400エラーを返す**
                return c.json({ error: 'Invalid tuning_id' }, 400)
            }

            // **🛠 Tunings テーブルのチューニング情報を更新**
            const { tuning_name, tuning_price, tuning_image_url } =
                CreateTuningRequestSchema.parse(await c.req.json())

            const result = await c.env.DB.prepare(
                `UPDATE Tunings SET tuning_name = ?1, tuning_price = ?2, tuning_image_url = ?3 WHERE tuning_id = ?4`,
            )
                .bind(tuning_name, tuning_price, tuning_image_url || null, tuning_id)
                .run()

            if (result.meta.changes === 0) {
                // **❌ チューニングが見つからない、または更新されなかった場合、404エラーを返す**
                return c.json(
                    { error: 'Tuning not found or not updated' },
                    404,
                )
            }

            // **🎯 更新後のチューニング情報を取得**
            const updatedTuning = await c.env.DB.prepare(
                `SELECT * FROM Tunings WHERE tuning_id = ?1`,
            )
                .bind(tuning_id)
                .first()

            // **✅ 更新されたチューニング情報を返す**
            return c.json(updatedTuning, 200)
        } catch (err) {
            if (err instanceof z.ZodError) {
                // **⚠️ 入力バリデーションエラーを返す**
                return c.json(
                    { error: 'Invalid input', details: err.errors },
                    400,
                )
            }
            // **❌ その他のエラーを返す**
            console.error('Error updating tuning:', err)
            return c.json({ error: 'Internal Server Error' }, 500)
        }
    })

    // ----------------------------------
    // 🟢 DELETE /api/tunings/:tuning_id
    // **📌 特定のチューニングを削除**
    // **送信するコンテンツ:**
    // なし
    // **取得できるコンテンツ:**
    // なし (204 No Content)
    // ----------------------------------
    .delete('/:tuning_id', async (c) => {
        try {
            const tuning_id = parseInt(c.req.param('tuning_id'), 10)
            if (isNaN(tuning_id)) {
                // **⚠️ 無効な tuning_id の場合、400エラーを返す**
                return c.json({ error: 'Invalid tuning_id' }, 400)
            }

            // **🛠 Tunings テーブルからチューニングを削除**
            const result = await c.env.DB.prepare(
                `DELETE FROM Tunings WHERE tuning_id = ?1`,
            )
                .bind(tuning_id)
                .run()

            if (result.meta.changes === 0) {
                // **❌ チューニングが見つからない場合、404エラーを返す**
                return c.json({ error: 'Tuning not found' }, 404)
            }

            // **✅ チューニング削除成功時に204 No Contentを返す**
            return new Response(null, { status: 204 })
        } catch (err) {
            // **❌ エラー発生時に内部サーバーエラーを返す**
            console.error('Error deleting tuning:', err)
            return c.json({ error: 'Internal Server Error' }, 500)
        }
    })

export default tuningRoutes
