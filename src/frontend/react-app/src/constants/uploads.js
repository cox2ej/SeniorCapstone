const MAX_ATTACHMENT_SIZE_MB = Number(import.meta.env.VITE_MAX_ATTACHMENT_SIZE_MB || 10)
export const MAX_ATTACHMENT_SIZE_BYTES = MAX_ATTACHMENT_SIZE_MB * 1024 * 1024
export const ATTACHMENT_SIZE_HELP_TEXT = `Each file must be ${MAX_ATTACHMENT_SIZE_MB} MB or smaller.`

export function validateAttachmentSizes(files = []) {
  if (!Array.isArray(files)) return
  files.forEach((file) => {
    if (!file) return
    if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
      throw new Error(ATTACHMENT_SIZE_HELP_TEXT)
    }
  })
}
