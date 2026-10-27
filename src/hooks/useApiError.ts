import { App, type FormInstance } from 'antd'
import { useCallback } from 'react'
import { ApiError } from '../api/client'

/**
 * Show an API error to the user. Messages from the backend are already in
 * Indonesian; 422 field details are mapped onto the form's fields (the form's
 * field names match the API's JSON names).
 */
export function useApiError() {
  const { message } = App.useApp()

  return useCallback(
    (err: unknown, form?: FormInstance) => {
      if (!(err instanceof ApiError)) {
        message.error('Terjadi kesalahan tak terduga.')
        return
      }
      const details = err.details ? Object.entries(err.details) : []
      if (form && details.length) {
        form.setFields(details.map(([name, msg]) => ({ name, errors: [msg] })))
      }
      const text = details.length ? details.map(([, msg]) => msg).join(' ') : err.message
      message.error(text || 'Terjadi kesalahan.')
    },
    [message],
  )
}
