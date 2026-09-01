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

describe('filtre par effet ennemi contré', () => {
  beforeEach(() => {
    cleanup()
    localStorage.clear()
  })

  it('filtre toute la base en intersection et affiche la nature du contre', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Base' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Ma box' }))
    fireEvent.change(screen.getByRole('combobox', { name: 'Effet ennemi' }), { target: { value: 'Barrier' } })
    fireEvent.change(screen.getByPlaceholderText('Nom ou ID…'), { target: { value: 'Sogeking' } })

    expect(screen.getByText('Sogeking', { exact: true })).toBeInTheDocument()
    expect(screen.getAllByText('ignore · potential').length).toBeGreaterThan(0)

    fireEvent.change(screen.getByRole('combobox', { name: 'Effet ennemi' }), { target: { value: 'Slot Barrier' } })
    fireEvent.change(screen.getByPlaceholderText('Nom ou ID…'), { target: { value: '3364' } })
    expect(screen.getByText('Sanji - Blue Suit Cook', { exact: true })).toBeInTheDocument()
    expect(screen.getByText('réduit 5 stacks · potential')).toBeInTheDocument()

    fireEvent.change(screen.getByRole('combobox', { name: 'Effet ennemi' }), { target: { value: 'ATK Up' } })
    fireEvent.change(screen.getByPlaceholderText('Nom ou ID…'), { target: { value: '3049' } })
    expect(screen.getByText('réduit complètement · special')).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText('Nom ou ID…'), { target: { value: 'Monkey D. Luffy' } })
    expect(screen.queryByText('Sogeking', { exact: true })).not.toBeInTheDocument()
  })

  it('intersecte le filtre avec la recherche intelligente du builder', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Créer une équipe PVE' }))
    fireEvent.click(screen.getByText('Nouvelle équipe PVE', { exact: true }))

    const search = screen.getByPlaceholderText('Nom ou ID…')
    fireEvent.change(search, { target: { value: '1935' } })
    fireEvent.click(screen.getByText('Franky - Super Weapon from a Future Land', { exact: true }).closest('.unit-tile')!)

    const conditionSummary = screen.getAllByLabelText(/If your crew has 6 characters with Fighter/)[0]
    fireEvent.click(conditionSummary.closest('label')!.querySelector('input')!)
    fireEvent.change(search, { target: { value: 'Bobbin' } })
    fireEvent.change(screen.getByRole('combobox', { name: 'Effet ennemi' }), { target: { value: 'Threshold Damage Reduction' } })

    expect(screen.getByText('Bobbin - Big Mom Pirates', { exact: true })).toBeInTheDocument()
    expect(screen.getByText('réduit 5 tours · special')).toBeInTheDocument()

    fireEvent.change(search, { target: { value: 'Avalo Pizarro' } })
    expect(screen.queryByText('Avalo Pizarro - Island-Man Stopping the Destruction', { exact: true })).not.toBeInTheDocument()
  })

  it('ne propose pas ce filtre dans le builder PVP', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Rumble' }))
    fireEvent.click(screen.getByText('Nouvelle équipe Rumble', { exact: true }))
    expect(screen.queryByRole('combobox', { name: 'Effet ennemi' })).not.toBeInTheDocument()
  })
})
