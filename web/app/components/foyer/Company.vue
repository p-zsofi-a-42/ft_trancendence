<script setup lang="ts">
import type { FormError, FormSubmitEvent } from "@nuxt/ui";
import type { SplitterItem } from "@nuxt/ui";
import type { Company } from "#shared/types/game";

const route = useRoute();
const { user } = useUserSession();

const companiesModel = defineModel<Company[]>({
  required: true,
});

const userCompany = computed(() =>
  companiesModel.value.find(
    (company) => String(company.userId) === String(user.value?.id),
  ),
);

type CompanyDraft = Pick<Company, "name" | "color">;

const companyForm = reactive<CompanyDraft>({
  name: userCompany.value?.name ?? "",
  color: userCompany.value?.color ?? "red",
});

function validate(state: Partial<Company>): FormError[] {
  const errors: FormError[] = [];

  if (!state.name?.trim()) errors.push({ name: "name", message: "Required" });

  return errors;
}

const companyViewItems: SplitterItem[] = [
  {
    slot: "company-list",
    minSize: 30,
    defaultSize: 50,
  },
  {
    slot: "config",
    minSize: 30,
    defaultSize: 50,
  },
];

const emit = defineEmits<{
  start: [];
}>();

async function submit(event: FormSubmitEvent<Company>) {
  emit("start");
}
</script>

<template>
  <USplitter
    :items="companyViewItems"
    :ui="{
      root: 'w-full h-full min-h-0',
      panel: 'h-full min-h-0 p-0 justify-center',
    }"
  >
    <template #company-list>
      <UCard title="List of Companies" variant="foyer"> </UCard>
    </template>
    <template #config>
      <UCard title="Company Config" variant="foyer">
        <UForm
          :state="companyForm"
          :validate="validate"
          @submit="submit"
          class="flex flex-col gap-4"
        >
          <FormFieldString
            v-model="companyForm.name"
            label="Name"
            name="name"
            required
          />
          <FormFieldColor
            v-model="companyForm.color"
            label="Company color"
            name="color"
            :colors="['red', 'blue', 'green', 'yellow', 'purple']"
          />
        </UForm>
      </UCard>
    </template>
  </USplitter>
</template>
