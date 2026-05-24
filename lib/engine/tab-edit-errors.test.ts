import { describe, expect, it } from 'vitest'
import { isTransientTabEditError } from './tab-edit-errors'

describe('isTransientTabEditError', () => {
  it('matches chrome drag-in-progress message', () => {
    expect(
      isTransientTabEditError(
        new Error('Tabs cannot be edited right now (user may be dragging a tab).'),
      ),
    ).toBe(true)
  })

  it('does not match other tab errors', () => {
    expect(isTransientTabEditError(new Error('No tab with id: 42'))).toBe(false)
  })
})
