import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { Bindings } from '../index'

// **📝 ユーザーのバリデーションスキーマ**
const UserSchema = z.object({
    firebase_user_id: z.string(),
    user_email: z.string().email(),
    user_name: z.string(),
})

// **🚗 ユーザー関連のルート定義**
export const userRoutes = new Hono<{ Bindings: Bindings }>()
    // ----------------------------------
    // 🟢 POST /api/users
    // **📌 ユーザーを新規作成**
    // **送信するコンテンツ:**
    // {
    //   "firebase_user_id": "string",
    //   "user_email": "user@example.com",
    //   "user_name": "ユーザー名"
    // }
    // **取得できるコンテンツ:**
    // 作成されたユーザーオブジェクト
    // ----------------------------------
    .post('/', zValidator('json', UserSchema), async (c) => {
        try {
            const { firebase_user_id, user_email, user_name } = await c.req.json()

            // **🚀 Users テーブルにユーザー情報を追加**
            await c.env.DB.prepare(
                `INSERT INTO Users (firebase_user_id, user_email, user_name) VALUES (?1, ?2, ?3)`
            )
                .bind(firebase_user_id, user_email, user_name)
                .run()

            // **🎯 作成されたユーザー情報を取得**
            const user = await c.env.DB.prepare(
                `SELECT * FROM Users WHERE firebase_user_id = ?1`
            )
                .bind(firebase_user_id)
                .first()

            if (!user) {
                return c.json({ error: 'User creation failed' }, 500)
            }

            return c.json(user, 201)
        } catch (err) {
            if (err instanceof z.ZodError) {
                return c.json(
                    { error: 'Invalid input', details: err.errors },
                    400
                )
            }
            console.error('Error creating user:', err)
            return c.json({ error: 'Internal Server Error' }, 500)
        }
    })

    // ----------------------------------
    // 🟢 GET /api/users
    // **📌 全てのユーザーを取得**
    // **送信するコンテンツ:**
    // なし
    // **取得できるコンテンツ:**
    // ユーザーオブジェクトの配列
    // ----------------------------------
    .get('/', async (c) => {
        try {
            const users = await c.env.DB.prepare(`SELECT * FROM Users`).all()
            return c.json(users.results, 200)
        } catch (err) {
            console.error('Error fetching users:', err)
            return c.json({ error: 'Internal Server Error' }, 500)
        }
    })

    // ----------------------------------
    // 🟢 GET /api/users/:firebase_user_id
    // **📌 特定のユーザーを取得**
    // **送信するコンテンツ:**
    // なし
    // **取得できるコンテンツ:**
    // 指定された `firebase_user_id` のユーザーオブジェクト
    // ----------------------------------
    .get('/:firebase_user_id', async (c) => {
        try {
            const firebase_user_id = c.req.param('firebase_user_id')

            const user = await c.env.DB.prepare(
                `SELECT * FROM Users WHERE firebase_user_id = ?1`
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

    // ----------------------------------
    // 🟢 PUT /api/users/:firebase_user_id
    // **📌 特定のユーザー情報を更新**
    // **送信するコンテンツ:**
    // {
    //   "user_email": "newemail@example.com",
    //   "user_name": "新しいユーザー名"
    // }
    // **取得できるコンテンツ:**
    // 更新されたユーザーオブジェクト
    // ----------------------------------
    .put('/:firebase_user_id', zValidator('json', UserSchema), async (c) => {
        try {
            const firebase_user_id = c.req.param('firebase_user_id')
            const { user_email, user_name } = await c.req.json()

            // **🛠 Users テーブルのユーザー情報を更新**
            const result = await c.env.DB.prepare(
                `UPDATE Users SET user_email = ?1, user_name = ?2 WHERE firebase_user_id = ?3`
            )
                .bind(user_email, user_name, firebase_user_id)
                .run()

            if (result.meta.changes === 0) {
                return c.json({ error: 'User not found or not updated' }, 404)
            }

            // **🎯 更新後のユーザー情報を取得**
            const updatedUser = await c.env.DB.prepare(
                `SELECT * FROM Users WHERE firebase_user_id = ?1`
            )
                .bind(firebase_user_id)
                .first()

            return c.json(updatedUser, 200)
        } catch (err) {
            console.error('Error updating user:', err)
            return c.json({ error: 'Internal Server Error' }, 500)
        }
    })

    // ----------------------------------
    // 🟢 DELETE /api/users/:firebase_user_id
    // **📌 特定のユーザーを削除**
    // **送信するコンテンツ:**
    // なし
    // **取得できるコンテンツ:**
    // なし (204 No Content)
    // ----------------------------------
    .delete('/:firebase_user_id', async (c) => {
        try {
            const firebase_user_id = c.req.param('firebase_user_id')

            // **🛠 Users テーブルからユーザーを削除**
            const result = await c.env.DB.prepare(
                `DELETE FROM Users WHERE firebase_user_id = ?1`
            )
                .bind(firebase_user_id)
                .run()

            if (result.meta.changes === 0) {
                return c.json({ error: 'User not found' }, 404)
            }

            return new Response(null, { status: 204 }) // ✅ 204 No Content
        } catch (err) {
            console.error('Error deleting user:', err)
            return c.json({ error: 'Internal Server Error' }, 500)
        }
    })

export default userRoutes
