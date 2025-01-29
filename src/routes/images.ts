import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { Bindings } from '../index'

export const imagesRoutes = new Hono<{ Bindings: Bindings }>()

const ImageUploadSchema = z.object({
    file: z.instanceof(File)
})

imagesRoutes.post(
    '/',
    async (c) => {
        try {
            const bucket = c.env?.BUCKET_NAME
            const endpoint = c.env?.R2_ENDPOINT_URL
            const clientId = c.env?.R2_ACCESS_KEY_ID
            const secret = c.env?.R2_SECRET_ACCESS_KEY

            if (!bucket || !endpoint || !clientId || !secret) {
                return c.json({ error: 'R2 credentials are not set' }, 500)
            }

            const body = await c.req.formData()
            const file = body.get('file')

            if (!(file instanceof File)) {
                return c.json({ error: 'No file uploaded' }, 400)
            }

            const key = `images/${file.name}`
            const r2 = new URL(endpoint)
            const url = `${r2.protocol}//${bucket}.${r2.hostname}/${key}`

            const response = await fetch(`${endpoint}/${bucket}/${key}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': file.type || 'application/octet-stream',
                    'x-amz-acl': 'public-read',
                    Authorization: `AWS ${clientId}:${secret}`
                },
                body: await file.arrayBuffer()
            })

            if (!response.ok) {
                return c.json({ error: 'Failed to upload file' }, 500)
            }

            return c.json({ url }, 201)
        } catch (err) {
            console.error('Error uploading image:', err)
            return c.json({ error: 'Internal Server Error' }, 500)
        }
    }
)
