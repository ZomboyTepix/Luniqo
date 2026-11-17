import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'

import { ApiError } from '@/api/errors'

import { corrections } from '../../../test/fixtures'
import { CorrectionLog } from './correction-log'

const meta = {
  title: 'Présences/Journal des corrections',
  component: CorrectionLog,
  args: { entries: corrections, pending: false, error: null },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof CorrectionLog>

export default meta
type Story = StoryObj<typeof meta>

/** Une heure corrigée, puis une présence retirée : qui, quand, pourquoi, ce qui a changé. */
export const Journal: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Présence corrigée · Léo Garnier · 29 octobre 2026')).toBeVisible()
    await expect(canvas.getByText('Départ : 17:20 → 17:05')).toBeVisible()
    await expect(canvas.getByText('Présence retirée · Emma Lambert · 29 octobre 2026')).toBeVisible()
    await expect(canvas.getByText('Motif : Pointée sur le mauvais enfant')).toBeVisible()
    await expect(canvas.getAllByText(/^Par Camille Martin, le 30 octobre 2026 à/)).toHaveLength(2)
  },
}

export const Chargement: Story = { args: { entries: undefined, pending: true } }

export const AucuneCorrection: Story = { args: { entries: [] } }

export const Erreur: Story = {
  args: { entries: undefined, error: new ApiError(403, 'Seule la direction peut gérer cette crèche') },
}
