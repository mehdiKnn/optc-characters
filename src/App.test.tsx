import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'

describe('sélection du Friend Captain', () => {
  beforeEach(() => localStorage.clear())

  it('reste limitée aux personnages de la box', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Créer une équipe PVE' }))
    fireEvent.click(screen.getByText('Nouvelle équipe PVE', { exact: true }))
    fireEvent.click(screen.getByRole('button', { name: /Friend.*Choisir/ }))

    const search = screen.getByPlaceholderText('Nom ou ID…')
    fireEvent.change(search, { target: { value: 'Monkey D. Luffy' } })
    expect(screen.queryByText('Monkey D. Luffy', { exact: true })).not.toBeInTheDocument()

    fireEvent.change(search, { target: { value: '261' } })
    expect(screen.getByText('Whitebeard', { exact: true })).toBeInTheDocument()
  })
})
