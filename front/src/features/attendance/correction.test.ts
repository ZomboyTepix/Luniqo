import { describe, expect, it } from 'vitest'

import type { Schemas } from '@/api/types'

import { periodAttendance } from '../../../test/fixtures'
import {
  additionBody,
  additionSchema,
  changesSomething,
  correctableDays,
  correctionBody,
  correctionDefaults,
  correctionSchema,
  describeChanges,
  isCorrectable,
  KEEP,
  NOBODY,
} from './correction'

// Le 28 octobre, Léo est arrivé à 08:50 (Paris) et son départ n'a pas été pointé.
const forgotten = periodAttendance[0] as Schemas['AttendanceOut']
// Le 29, Léo est arrivé à 08:40 et reparti à 17:05 avec Alice.
const complete = periodAttendance[1] as Schemas['AttendanceOut']

describe('correction d’une présence', () => {
  it('part des heures de la présence, à Paris', () => {
    expect(correctionDefaults(forgotten)).toEqual({
      arrival: '08:50',
      departure: '',
      droppedOffBy: KEEP,
      pickedUpBy: KEEP,
      reason: '',
    })
    expect(correctionDefaults(complete).departure).toBe('17:05')
  })

  it("n'envoie que ce qui change", () => {
    const values = { ...correctionDefaults(forgotten), departure: '17:30', reason: 'Départ oublié' }
    const body = correctionBody(forgotten, values)
    expect(body).toEqual({ reason: 'Départ oublié', departed_at: '2026-10-28T16:30:00.000Z' })
    expect(changesSomething(body)).toBe(true)
    expect(changesSomething(correctionBody(forgotten, { ...correctionDefaults(forgotten), reason: 'Rien' }))).toBe(
      false,
    )
  })

  it('retire un départ ou une personne, ou choisit un responsable', () => {
    const values = {
      ...correctionDefaults(complete),
      departure: '',
      pickedUpBy: KEEP,
      droppedOffBy: NOBODY,
      reason: 'Départ pointé par erreur',
    }
    expect(correctionBody(complete, values)).toEqual({
      reason: 'Départ pointé par erreur',
      departed_at: null,
      dropped_off_by: null,
    })
    const chosen = { ...correctionDefaults(complete), pickedUpBy: 'id-karim', reason: 'Karim est venu' }
    expect(correctionBody(complete, chosen)).toEqual({ reason: 'Karim est venu', picked_up_by: 'id-karim' })
  })

  it('refuse un motif trop court, un départ avant l’arrivée, une personne sans départ', () => {
    const base = { ...correctionDefaults(forgotten), reason: 'Départ oublié' }
    expect(correctionSchema.safeParse(base).success).toBe(true)
    expect(correctionSchema.safeParse({ ...base, reason: '  oui ' }).success).toBe(false)
    expect(correctionSchema.safeParse({ ...base, departure: '08:00' }).success).toBe(false)
    expect(correctionSchema.safeParse({ ...base, pickedUpBy: 'id-alice' }).success).toBe(false)
    expect(correctionSchema.safeParse({ ...base, pickedUpBy: 'id-alice', departure: '17:00' }).success).toBe(true)
    expect(correctionSchema.safeParse({ ...base, arrival: '8h50' }).success).toBe(false)
  })

  it('motif nettoyé de ses espaces', () => {
    const parsed = correctionSchema.parse({ ...correctionDefaults(forgotten), reason: '  Départ oublié  ' })
    expect(parsed.reason).toBe('Départ oublié')
  })
})

describe('présence oubliée', () => {
  it('construit le corps du POST, à l’heure de Paris', () => {
    const values = additionSchema.parse({
      childId: 'id-emma',
      day: '2026-10-29',
      arrival: '08:15',
      departure: '16:00',
      droppedOffBy: NOBODY,
      pickedUpBy: 'id-sophie',
      reason: 'Tablette en panne ce jour-là',
    })
    expect(additionBody(values)).toEqual({
      child_id: 'id-emma',
      arrived_at: '2026-10-29T07:15:00.000Z',
      departed_at: '2026-10-29T15:00:00.000Z',
      dropped_off_by: null,
      picked_up_by: 'id-sophie',
      reason: 'Tablette en panne ce jour-là',
    })
  })

  it("exige l'enfant", () => {
    const values = {
      childId: '',
      day: '2026-10-29',
      arrival: '08:15',
      departure: '',
      droppedOffBy: NOBODY,
      pickedUpBy: NOBODY,
      reason: 'Tablette en panne',
    }
    expect(additionSchema.safeParse(values).success).toBe(false)
  })
})

describe('délai de correction', () => {
  it('31 jours, comme l’API', () => {
    expect(correctableDays('2026-10-30')).toEqual({ min: '2026-09-29', max: '2026-10-30' })
    expect(isCorrectable({ ...forgotten, day: '2026-09-29' }, '2026-10-30')).toBe(true)
    expect(isCorrectable({ ...forgotten, day: '2026-09-28' }, '2026-10-30')).toBe(false)
  })
})

describe('journal', () => {
  const before = {
    arrived_at: '2026-10-28T07:50:00Z',
    departed_at: null,
    dropped_off_by: 'Alice Garnier',
    picked_up_by: null,
  }

  it('montre ce qui a changé', () => {
    const after = { ...before, departed_at: '2026-10-28T16:30:00Z', picked_up_by: 'Karim Garnier' }
    expect(describeChanges(before, after)).toEqual(['Départ : — → 17:30', 'Parti·e avec : — → Karim Garnier'])
  })

  it('présence ajoutée ou retirée : ses valeurs', () => {
    expect(describeChanges(null, before)).toEqual(['Arrivée : 08:50', 'Amené·e par : Alice Garnier'])
    expect(describeChanges(before, null)).toEqual(['Arrivée : 08:50', 'Amené·e par : Alice Garnier'])
  })
})
