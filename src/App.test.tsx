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

describe('mode de combinaison des conditions', () => {
  beforeEach(() => {
    cleanup()
    localStorage.clear()
  })

  const openGabanBuilder = () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Créer une équipe PVE' }))
    fireEvent.click(screen.getByText('Nouvelle équipe PVE', { exact: true }))
    const search = screen.getByPlaceholderText('Nom ou ID…')
    fireEvent.change(search, { target: { value: '4630' } })
    fireEvent.click(screen.getByText('Scopper Gaban - The Left Arm of the Pirate King', { exact: true }).closest('.unit-tile')!)
    return search
  }

  const checkCondition = (source: RegExp) => {
    const summary = screen.getAllByLabelText(source)[0]
    fireEvent.click(summary.closest('label')!.querySelector('input')!)
  }

  it('combine par défaut toutes les conditions actives en ET', () => {
    const search = openGabanBuilder()

    expect(screen.getByRole('button', { name: 'ET', pressed: true })).toBeInTheDocument()
    checkCondition(/If your crew has 6 \[DEX\] characters/)
    checkCondition(/If your crew has 5\+ \[Elbaph Arc\], \[Giant\] or \[Roger Pirates\] characters/)
    fireEvent.change(search, { target: { value: 'Collun' } })
    expect(screen.getByText('Collun', { exact: true })).toBeInTheDocument()

    fireEvent.change(search, { target: { value: 'Hongo' } })

    expect(screen.queryByText('Hongo - Punishing the "Man-Eater"', { exact: true })).not.toBeInTheDocument()
    expect(screen.getByText(/0 candidats/)).toBeInTheDocument()
  })

  it('réaffiche en OU un candidat qui ne progresse qu’une condition', () => {
    const search = openGabanBuilder()
    checkCondition(/If your crew has 6 \[DEX\] characters/)
    checkCondition(/If your crew has 5\+ \[Elbaph Arc\], \[Giant\] or \[Roger Pirates\] characters/)
    fireEvent.change(search, { target: { value: 'Hongo' } })

    fireEvent.click(screen.getByRole('button', { name: 'OU' }))

    expect(screen.getByRole('button', { name: 'OU', pressed: true })).toBeInTheDocument()
    expect(screen.getByText('Hongo - Punishing the "Man-Eater"', { exact: true })).toBeInTheDocument()
  })

  it('retire du ET une condition déjà remplie', () => {
    const search = openGabanBuilder()
    const addMember = (slot: number, id: string, name: string) => {
      fireEvent.click(screen.getByRole('button', { name: new RegExp(`Membre ${slot}.*Choisir`) }))
      fireEvent.change(search, { target: { value: id } })
      fireEvent.click(screen.getByText(name, { exact: true }).closest('.unit-tile')!)
    }
    addMember(1, '4539', 'Kashii - Party on the Ship')
    addMember(2, '4614', "Brook - Musician in Warrior's Outfit")
    addMember(3, '4618', 'Collun')
    checkCondition(/If your crew has 4\+ \[DEX\] characters/)
    checkCondition(/If your crew has 5\+ \[Elbaph Arc\], \[Giant\] or \[Roger Pirates\] characters/)

    fireEvent.change(search, { target: { value: 'Hongo' } })

    expect(screen.getByText('Hongo - Punishing the "Man-Eater"', { exact: true })).toBeInTheDocument()
  })

  it('applique le même mode de combinaison en Rumble', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Rumble' }))
    fireEvent.click(screen.getByText('Nouvelle équipe Rumble', { exact: true }))
    const search = screen.getByPlaceholderText('Nom ou ID…')
    fireEvent.change(search, { target: { value: '4630' } })
    fireEvent.click(screen.getByText('Scopper Gaban - The Left Arm of the Pirate King', { exact: true }).closest('.unit-tile')!)
    checkCondition(/4\+ \[Elbaph Arc\] dans l’équipe/)
    checkCondition(/5\+ \[DEX\] dans l’équipe/)
    fireEvent.change(search, { target: { value: 'Hongo' } })

    expect(screen.queryByText('Hongo - Punishing the "Man-Eater"', { exact: true })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'OU' }))
    expect(screen.getByText('Hongo - Punishing the "Man-Eater"', { exact: true })).toBeInTheDocument()
  })

  it('applique une condition « only » comme exclusion dans les deux modes', () => {
    localStorage.setItem('optc.v1.box', JSON.stringify(['2147', '1', '1935']))
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Créer une équipe PVE' }))
    fireEvent.click(screen.getByText('Nouvelle équipe PVE', { exact: true }))
    const search = screen.getByPlaceholderText('Nom ou ID…')
    fireEvent.change(search, { target: { value: '2147' } })
    fireEvent.click(screen.getByText("Vinsmoke Sanji - Germa Kingdom's Sacrifice", { exact: true }).closest('.unit-tile')!)
    checkCondition(/If your crew has only Fighter characters/)

    fireEvent.change(search, { target: { value: '1' } })
    expect(screen.getByText('Monkey D. Luffy', { exact: true })).toBeInTheDocument()
    fireEvent.change(search, { target: { value: '1935' } })
    expect(screen.queryByText('Franky - Super Weapon from a Future Land', { exact: true })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'OU' }))
    expect(screen.queryByText('Franky - Super Weapon from a Future Land', { exact: true })).not.toBeInTheDocument()
    fireEvent.change(search, { target: { value: '1' } })
    expect(screen.getByText('Monkey D. Luffy', { exact: true })).toBeInTheDocument()
  })

  it('revient à ET à chaque ouverture du builder', () => {
    openGabanBuilder()
    fireEvent.click(screen.getByRole('button', { name: 'OU' }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Équipes' })[1])
    fireEvent.click(screen.getByText('Nouvelle équipe PVE', { exact: true }))

    expect(screen.getByRole('button', { name: 'ET', pressed: true })).toBeInTheDocument()
  })
})
