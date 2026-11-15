import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { defineComponent, h, type PropType } from 'vue'
import login from '../../app/pages/login.vue'

const { mockFetch } = vi.hoisted(() => ({ mockFetch: vi.fn() }))

mockNuxtImport('$fetch', () => mockFetch)

type AuthField = { name: string; type: string }

const AuthFormStub = defineComponent({
  name: 'UAuthForm',
  props: {
    title: String,
    fields: { type: Array as PropType<AuthField[]>, default: () => [] },
  },
  emits: ['submit'],
  setup(props, { emit, slots }) {
    return () => h('form', {
      onSubmit(event: Event) {
        event.preventDefault()
        emit('submit', {
          data: { email: 'user@example.com', password: 'password123', code: '123456' },
        })
      },
    }, [
      h('h2', props.title),
      ...props.fields.map((field) =>
        h('input', { name: field.name, type: field.type }),
      ),
      h('button', { type: 'submit' }, 'Continue'),
      slots.description?.(),
    ])
  },
})

async function mountTwoFactorForm() {
  mockFetch.mockResolvedValue({ totpRequired: true })
  const wrapper = await mountSuspended(login, {
    global: { stubs: { UAuthForm: AuthFormStub } },
  })
  await wrapper.get('form').trigger('submit')
  await flushPromises()
  return wrapper
}

describe('Login form', () => {
  it('renders the credentials fields and registration link', async () => {
    const wrapper = await mountSuspended(login)

    expect(wrapper.text()).toContain('Enter your credentials to access your account.')
    expect(wrapper.text()).toContain("Don't have an account?")
    expect(wrapper.text()).toContain('Sign Up')
    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
    expect(wrapper.find('input[type="password"]').exists()).toBe(true)
  })
})

describe('Two-factor form', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('opens after login requires two-factor verification', async () => {
    const wrapper = await mountTwoFactorForm()

    expect(wrapper.text()).toContain('Two-factor authentication')
    expect(wrapper.text()).toContain('Enter the 6-digit code from your authenticator app.')
    expect(wrapper.find('input[name="code"]').exists()).toBe(true)
  })

  it('switches between authenticator and recovery-code instructions', async () => {
    const wrapper = await mountTwoFactorForm()

    const recoveryToggle = wrapper.findAll('button').find((button) =>
      button.text().includes('Use a recovery code instead'),
    )
    expect(recoveryToggle).toBeDefined()
    await recoveryToggle!.trigger('click')

    expect(wrapper.text()).toContain('Enter one of your recovery codes.')
    expect(wrapper.text()).toContain('Use authenticator code instead')
  })
})