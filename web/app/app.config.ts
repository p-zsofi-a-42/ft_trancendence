export default defineAppConfig({
  ui: {
    colors: {
      primary: 'blue',
			secondary: 'amber',
      success: 'green',
			info: 'emerald',
			warning: 'orange',
			error: 'red',
			neutral: 'slate'
    },
		header: {
			slots: {
				left: 'flex '
			}
		},
		main: {
			base: 'flex-1 grid place-items-center p-4'
		},
		button: {
			slots: {

			}
		},
		tabs: {
			slots: {
				root: 'flex flex-col w-fit rounded-2xl p-4 items-center justify-center'
			}
		},
		card: {
			slots: {
				root: 'flex flex-col w-fit items-center content-center rounded-2xl bg-neutral-500 p-1',
			}
		}
  },
  
})