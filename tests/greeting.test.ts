import { describe, expect, it } from 'vitest'
import { greeting } from '../utils/greeting'

describe('greeting', () => {
  it('greets a person by name', () => {
    expect(greeting('team')).toBe('Hello, team!')
  })
})
