export default defineAppConfig({
	ui: {
	colors: {
		primary: 'myor-a',
		secondary: 'myor-b',
		neutral: 'mygray',
		success: 'mysuccess',
		info: 'myblue',
		warning: 'mywarning',
		error: 'myerror',
    },
    tooltip: {
      slots: {
        arrow: `align-baseline`,
      },
    },
    toast: {
      slots: {
        title: 'font-system-reply text-xs leading-tight',
        description: 'font-system-reply text-xs leading-tight',
      },
    },
    card: {
      slots: {
        root: [
            'flex flex-col',
            'w-fit',
            'rounded-2xl',
            'p-1',
            'text-default'
        ],
        title: "flex flex-col items-center content-center",
      },
      variants: {
        variant: {
          foyer: {
            root: [
              'bg-elevated/50',
              'w-full min-w-0',
              'text-default',
            ],
          },
        },
      },
    },
    pageCard: {
      slots: {
        root: 'text-default'
      }
    },
    button: {
      variants: {
        variant: {
          foyer: "",
        },
      },
      compoundVariants: [
        {
          color: "primary",
          variant: "foyer",
          class:
            "text-white bg-primary hover:bg-primary/75 active:bg-primary/75 disabled:bg-primary aria-disabled:bg-primary outline-primary/25 focus-visible:outline-3 block mt-4",
        },
      ],
    },
  },
});

/*

Sizes: xs, sm, md, lg, xl.

Button:
solid, outline, soft, subtle, ghost, link.
Input
outline, soft, subtle, ghost, none.

*/