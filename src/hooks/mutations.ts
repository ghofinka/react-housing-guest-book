import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Visit } from '../api/types'
import { checkOut, erasePersonalData } from '../api/visits'
import { keys } from './queries'

function useVisitUpdated() {
  const qc = useQueryClient()
  return (visit: Visit) => {
    qc.setQueryData(keys.visit(visit.id), visit)
    if (visit.status === 'exited') {
      qc.setQueryData<Visit[]>(keys.inside, (old) => old?.filter((v) => v.id !== visit.id))
    }
    qc.invalidateQueries({ queryKey: keys.visits })
  }
}

/** M3: record the guest leaving. Idempotent on the server. */
export function useCheckOut() {
  const onSuccess = useVisitUpdated()
  return useMutation({ mutationFn: checkOut, onSuccess })
}

/** Admin: anonymise a visit on the data subject's request. */
export function useErasePersonalData() {
  const qc = useQueryClient()
  const onUpdated = useVisitUpdated()
  return useMutation({
    mutationFn: erasePersonalData,
    onSuccess: (visit) => {
      qc.removeQueries({ queryKey: ['photo'] })
      onUpdated(visit)
    },
  })
}
