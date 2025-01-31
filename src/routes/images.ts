import { Hono } from 'hono'
import { z } from 'zod'
import { Bindings } from '../index'

const imageUploadSchema = z.object({
    file: z.instanceof(File),
})

export const imagesRoutes = new Hono<{ Bindings: Bindings }>().post(
    '/',
    async (c) => {
        try {
            const formData = await c.req.formData()
            const file = formData.get('file') as File | null

            if (!file) {
                return c.json({ message: 'No file uploaded' }, 400)
            }
            const data = imageUploadSchema.parse({ file })

            const objectKey = data.file.name
            await c.env.R2.put(objectKey, data.file.stream(), {
                httpMetadata: {
                    contentType: data.file.type,
                },
            })

            const url = `https://r2.autotrack.work/${objectKey}`

            return c.json({ url })
        } catch (err) {
            if (err instanceof Error) {
                return c.json({ message: err.message }, 400)
            }
            return c.json({ message: 'Unknown error occurred' }, 400)
        }
    },
)
