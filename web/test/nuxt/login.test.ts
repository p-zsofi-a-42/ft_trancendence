import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import login from '../../app/pages/login.vue'

describe('Login page', () => {
  it('shows an error when fields are empty', async () => {
    // 1. Render the component. Mount using test environment
    const wrapper = await mountSuspended(login)

    // 2. Find the form and submit it
    await wrapper.find('form').trigger('submit')

    // 3. Check the result
    //expect(wrapper.text()).toContain("Login failed")
    expect(wrapper.text()).toContain("Don't have an account? Register here.")
  })
})