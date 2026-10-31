export default defineAppConfig({
  ui: {
    colors: {
      primary: "blue",
      secondary: "amber",
    },
    formField: {
      slots: {
        root: "flex items-start justify-between gap-2",
      },
      defaultVariants: {
        orientation: "horizontal",
      },
    },
    card: {
      slots: {
        root: "flex flex-col w-fit rounded-2xl p-1 text-inverted",
        title: "flex flex-col items-center content-center",
      },
      variants: {
        variant: {
          foyer: {
            root: "bg-elevated/50 text-default w-full min-w-0",
          },
        },
      },
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
            "text-inverted bg-primary hover:bg-primary/75 active:bg-primary/75 disabled:bg-primary aria-disabled:bg-primary outline-primary/25 focus-visible:outline-3 block mt-4",
        },
      ],
    },
  },
});
