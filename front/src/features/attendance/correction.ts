import { z } from 'zod'

import type { Schemas } from '@/api/types'
import { addDays, formatTime, parisInstant } from '@/lib/dates'

type Presence = Schemas['AttendanceOut']
type ChildGuardian = Schemas['ChildGuardianOut']

/** Choix d'une personne : ne rien changer, ou retirer la personne indiquée. */
export const KEEP = 'inchange'
export const NOBODY = 'personne'

/** Même délai que l'API (`CORRECTION_MAX_DAYS`) : au-delà, elle refuse (409). */
export const CORRECTION_MAX_DAYS = 31

// Confort de saisie : l'API refait chacun de ces contrôles et a le dernier mot.
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/

export const reasonSchema = z
  .string()
  .trim()
  .min(5, 'Indiquez le motif de la correction (5 caractères au moins).')
  .max(500, 'Motif limité à 500 caractères.')

const times = {
  arrival: z.string().regex(TIME, "Indiquez l'heure d'arrivée."),
  departure: z.string().refine((value) => value === '' || TIME.test(value), 'Heure de départ invalide.'),
  droppedOffBy: z.string(),
  pickedUpBy: z.string(),
  reason: reasonSchema,
}

type Times = { arrival: string; departure: string; pickedUpBy: string }

function checkTimes(values: Times, context: z.RefinementCtx) {
  if (values.departure !== '' && values.departure < values.arrival) {
    context.addIssue({ code: 'custom', message: "Le départ précède l'arrivée.", path: ['departure'] })
  }
  if (values.departure === '' && values.pickedUpBy !== KEEP && values.pickedUpBy !== NOBODY) {
    context.addIssue({
      code: 'custom',
      message: "Une personne venue chercher l'enfant suppose une heure de départ.",
      path: ['pickedUpBy'],
    })
  }
}

export const correctionSchema = z.object(times).superRefine(checkTimes)
export type CorrectionValues = z.infer<typeof correctionSchema>

/** Valeurs de départ du formulaire : celles de la présence, à l'heure de Paris. */
export function correctionDefaults(presence: Presence): CorrectionValues {
  return {
    arrival: formatTime(presence.arrived_at),
    departure: presence.departed_at === null ? '' : formatTime(presence.departed_at),
    droppedOffBy: KEEP,
    pickedUpBy: KEEP,
    reason: '',
  }
}

function person(choice: string): string | null | undefined {
  if (choice === KEEP) return undefined
  return choice === NOBODY ? null : choice
}

/**
 * Corps du `PATCH` : seuls les champs modifiés partent, l'API ne touche pas aux
 * autres. Une heure inchangée n'est pas renvoyée, ses secondes restent intactes.
 */
export function correctionBody(presence: Presence, values: CorrectionValues): Schemas['PresenceUpdate'] {
  const before = correctionDefaults(presence)
  const body: Schemas['PresenceUpdate'] = { reason: values.reason }
  if (values.arrival !== before.arrival) body.arrived_at = parisInstant(presence.day, values.arrival)
  if (values.departure !== before.departure) {
    body.departed_at = values.departure === '' ? null : parisInstant(presence.day, values.departure)
  }
  const droppedOffBy = person(values.droppedOffBy)
  if (droppedOffBy !== undefined) body.dropped_off_by = droppedOffBy
  const pickedUpBy = person(values.pickedUpBy)
  if (pickedUpBy !== undefined) body.picked_up_by = pickedUpBy
  return body
}

/** La correction change-t-elle quelque chose ? Sinon l'API la refuse (422), autant le dire avant. */
export function changesSomething(body: Schemas['PresenceUpdate']): boolean {
  return Object.keys(body).some((key) => key !== 'reason')
}

export const additionSchema = z
  .object({
    ...times,
    childId: z.string().min(1, "Choisissez l'enfant."),
    day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choisissez le jour.'),
  })
  .superRefine(checkTimes)
export type AdditionValues = z.infer<typeof additionSchema>

/** Corps du `POST` d'une présence oubliée. */
export function additionBody(values: AdditionValues): Schemas['PresenceCreate'] {
  return {
    child_id: values.childId,
    arrived_at: parisInstant(values.day, values.arrival),
    departed_at: values.departure === '' ? null : parisInstant(values.day, values.departure),
    dropped_off_by: person(values.droppedOffBy) ?? null,
    picked_up_by: person(values.pickedUpBy) ?? null,
    reason: values.reason,
  }
}

/** Jours qu'on peut encore corriger : du plus ancien accepté par l'API à aujourd'hui. */
export function correctableDays(today: string): { min: string; max: string } {
  return { min: addDays(today, -CORRECTION_MAX_DAYS), max: today }
}

export function isCorrectable(presence: Presence, today: string): boolean {
  return presence.day >= correctableDays(today).min
}

export function guardianName({ guardian }: ChildGuardian): string {
  return `${guardian.first_name} ${guardian.last_name}`
}

export const KIND_LABELS: Record<Schemas['CorrectionKind'], string> = {
  created: 'Présence ajoutée',
  modified: 'Présence corrigée',
  cancelled: 'Présence retirée',
}

type Values = Schemas['PresenceValues']

/** Ce qui a changé, ligne par ligne (« Départ : — → 17:30 »), pour le journal. */
export function describeChanges(before: Values | null, after: Values | null): string[] {
  const time = (iso: string | null | undefined) => (iso === null || iso === undefined ? '—' : formatTime(iso))
  const name = (value: string | null | undefined) => value ?? '—'
  const fields: [string, (values: Values | null) => string][] = [
    ['Arrivée', (values) => time(values?.arrived_at)],
    ['Amené·e par', (values) => name(values?.dropped_off_by)],
    ['Départ', (values) => time(values?.departed_at)],
    ['Parti·e avec', (values) => name(values?.picked_up_by)],
  ]
  return fields.flatMap(([label, read]) => {
    const from = read(before)
    const to = read(after)
    if (before === null) return to === '—' ? [] : [`${label} : ${to}`]
    if (after === null) return from === '—' ? [] : [`${label} : ${from}`]
    return from === to ? [] : [`${label} : ${from} → ${to}`]
  })
}
