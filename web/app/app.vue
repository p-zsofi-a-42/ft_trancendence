<script setup lang="ts">
import favicon from '~/assets/icons/profit.svg'

useHead({
	title: "The Beer Game",
	link: [
    {
      rel: 'icon',
      type: 'image/svg',
      href: favicon
    }
  ]
})
</script>

<template>
	<UApp>
		<NuxtLayout>
			<NuxtPage />
		</NuxtLayout>
	</UApp>
</template>
