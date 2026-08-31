import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'

describe('sélection du Friend Captain', () => {
  beforeEach(() => {
    cleanup()
    localStorage.clear()
  })

  const selectCandidate = (name: string) => {
    const label = screen.getAllByText(name, { exact: true }).find(element => element.closest('.unit-tile'))
    expect(label).toBeDefined()
    fireEvent.click(label!.closest('.unit-tile')!)
  }

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

  it('peut être la même unité que le capitaine', () => {
    const gaban = 'Scopper Gaban - The Left Arm of the Pirate King'

    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Créer une équipe PVE' }))
    fireEvent.click(screen.getByText('Nouvelle équipe PVE', { exact: true }))
    fireEvent.click(screen.getByRole('button', { name: /Capitaine.*Choisir/ }))

    const search = screen.getByPlaceholderText('Nom ou ID…')
    fireEvent.change(search, { target: { value: '4630' } })
    selectCandidate(gaban)

    fireEvent.click(screen.getByRole('button', { name: /Friend.*Choisir/ }))
    selectCandidate(gaban)

    expect(screen.getByRole('button', { name: /Capitaine.*Scopper Gaban/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Friend.*Scopper Gaban/ })).toBeInTheDocument()
  })
})
