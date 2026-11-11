<template>
  <UModal v-model:open="open" title="Set up two-factor authentication" :ui="{ content: 'max-w-md' }">
    <template #body>
      <UStepper ref="stepper" v-model="step" :items="steps" disabled />

      <!-- Step 1: scan QR / copy secret -->
      <div v-if="step === 0" class="flex flex-col items-center gap-4 py-4">
        <p class="text-sm text-muted">
          Scan this QR code with your authenticator app, or enter the secret manually.
        </p>
        <img v-if="qrDataUrl" :src="qrDataUrl" alt="TOTP QR code" class="h-48 w-48" />
        <UFormField label="Secret (manual entry)">
          <UInput :model-value="secret" readonly />
        </UFormField>
        <UButton label="Continue" :disabled="!secret" @click="step = 1" />
      </div>

      <!-- Step 2: confirm the first code -->
      <div v-else-if="step === 1" class="flex flex-col gap-4 py-4">
        <UFormField label="Enter the 6-digit code from your app">
          <UInput v-model="code" placeholder="123456" maxlength="6" />
        </UFormField>
        <p v-if="confirmError" class="text-sm text-error">{{ confirmError }}</p>
        <div class="flex gap-2">
          <UButton label="Back" variant="soft" @click="step = 0" />
          <UButton label="Confirm" :loading="confirming" @click="confirm" />
        </div>
      </div>

      <!-- Step 3: show recovery codes once -->
      <div v-else class="flex flex-col gap-4 py-4">
        <p class="text-sm text-muted">
          Save these recovery codes somewhere safe. Each one can be used once if you lose
          access to your authenticator app. They will not be shown again.
        </p>
        <ul class="grid grid-cols-2 gap-2 font-mono text-sm">
          <li v-for="rc in recoveryCodes" :key="rc" class="rounded bg-elevated px-2 py-1">{{ rc }}</li>
        </ul>
        <UButton label="Done" @click="finish" />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import QRCode from 'qrcode'

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ enabled: [] }>()

const steps = [
  { title: 'Scan QR code' },
  { title: 'Confirm code' },
  { title: 'Save recovery codes' },
]

const step = ref(0)
const secret = ref('')
const qrDataUrl = ref('')
const code = ref('')
const confirming = ref(false)
const confirmError = ref('')
const recoveryCodes = ref<string[]>([])

// Each time the modal opens, start a fresh setup (new secret) and reset wizard state.
watch(open, async (isOpen) => {
  if (!isOpen) return
  step.value = 0
  code.value = ''
  confirmError.value = ''
  recoveryCodes.value = []

  const { secret: newSecret, otpauthUrl } = await $fetch<{ secret: string; otpauthUrl: string }>(
    '/api/auth/totp/setup',
    { method: 'POST' },
  )
  secret.value = newSecret
  qrDataUrl.value = await QRCode.toDataURL(otpauthUrl)
})

async function confirm() {
  confirming.value = true
  confirmError.value = ''
  try {
    const { recoveryCodes: codes } = await $fetch<{ recoveryCodes: string[] }>(
      '/api/auth/totp/enable',
      { method: 'POST', body: { code: code.value } },
    )
    recoveryCodes.value = codes
    step.value = 2
  } catch (err: any) {
    confirmError.value = err.statusMessage ?? 'Invalid code, please try again.'
  } finally {
    confirming.value = false
  }
}

function finish() {
  emit('enabled')
  open.value = false
}
</script>
