export default defineAppConfig({
  ui: {
    colors: {
      primary: 'blue',
			secondary: 'amber',
    },
		formField: {
			slots: {
				root: 'flex items-start justify-between gap-2'
			},
			defaultVariants: {
				orientation: 'horizontal',
			}
		},
		tabs: {
			slots: {
				root: 'flex flex-col w-fit rounded-2xl p-4 items-center justify-center'
			}
		},
		card: {
			slots: {
				root: 'flex flex-col w-fit rounded-2xl p-1 text-inverted',
				title: 'flex flex-col items-center content-center',
			},
			variants: {
				variant: {
					foyer: {
						root: 'bg-elevated/50 text-default h-full w-full min-w-0',
					},
				}
			}
		},
  },
})