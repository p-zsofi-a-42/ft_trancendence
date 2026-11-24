import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import login from '../../app/pages/login.vue'

const usernameSelector = 'input[placeholder="Enter your username"]'
const passwordSelector = 'input[placeholder="Enter your password"]'

function expectAccessibleError(
  wrapper: Awaited<ReturnType<typeof mountSuspended>>,
  selector: string,
  message: string,
) {
  const input = wrapper.get(selector)
  expect(input.attributes('aria-invalid')).toBe('true')

  const errorId = input.attributes('aria-describedby')
  expect(errorId).toBeTruthy()
  expect(wrapper.get(`#${errorId}`).text()).toContain(message)
}

describe('Login page', () => {
  it('associates labels with the username and password controls', async () => {
    const wrapper = await mountSuspended(login)

    for (const [selector, labelText] of [
      [usernameSelector, 'Username'],
      [passwordSelector, 'Password'],
    ] as const) {
      const input = wrapper.get(selector)
      const inputId = input.attributes('id')

      expect(inputId).toBeTruthy()
      expect(wrapper.get(`label[for="${inputId}"]`).text()).toContain(labelText)
    }
  })

  it('shows accessible validation errors when required fields are missing', async () => {
    const wrapper = await mountSuspended(login)

    await wrapper.getComponent({ name: 'UForm' }).vm.submit()
    await flushPromises()

    expectAccessibleError(wrapper, usernameSelector, 'Username is required')
    expectAccessibleError(wrapper, passwordSelector, 'Password is required')
  })

  it('shows a validation error for a password shorter than eight characters', async () => {
    const wrapper = await mountSuspended(login)

    await wrapper.get(usernameSelector).setValue('test-user')
    await wrapper.get(passwordSelector).setValue('short')
    await wrapper.getComponent({ name: 'UForm' }).vm.submit()
    await flushPromises()

    expectAccessibleError(wrapper, passwordSelector, 'Must be at least 8 characters')
  })
})
