<template>
	<!--
	<<<<<<< Updated upstream <UContainer class="flex flex-col h-9/10 w-3/4 min-w-dvh">
		<UStepper ref="stepper" v-model="activeStep" :disabled="true" :items="stepper_items" :ui="{
			root: 'w-full flex-1 min-h-0 bg-bg rounded-2xl p-6',
			icon: 'bg-text',
			content: 'w-full flex-1 min-h-0',
		}">
			<template #content="{ item }">
				<div class="flex h-full flex-col">
					<div class="min-h-0 flex-1">
						<FoyerOverview v-if="item?.value === 'overview'" :game-code="gameCode" :players="players"
							:companies="companies" v-model="settings" @continue="stepper?.next()" />
						=======
-->
	<UContainer class="flex flex-col h-9/10 w-3/4 min-w-dvh">
		<UStepper ref="stepper" v-model="activeStep" :disabled="true" :items="stepper_items" :ui="{
			root: 'w-full flex-1 min-h-0 bg-bg rounded-2xl p-6',
			icon: 'bg-app-text',
			content: 'w-full flex-1 min-h-0',
		}">
			<template #content="{ item }">
				<div class="flex h-full flex-col">
					<div class="min-h-0 flex-1">
						<FoyerOverview v-if="item?.value === 'overview'" :game-code="gameCode" :companies="companies"
							v-model:settingsModel="settings" v-model:playersModel="players" @continue="stepper?.next()" />
						<!-- :players="players" -->
						<!-- >>>>>>> Stashed changes -->

						<FoyerCompany v-else-if="item?.value === 'company-setup'" v-model="companies" />
						<UCard v-else-if="item?.value === 'game-start'" variant="outline" title="Game starts in" :ui="{
							root: 'h-full w-full items-center justify-center',
							title: 'text-2xl',
							body: 'text-4xl text-center',
						}">
							3
						</UCard>
					</div>
					<div v-if="stepper?.hasNext" class="ml-auto flex p-4 pt-0">
						<UButton class="mx-3 bg-fancy-dark disabled:opacity-0 hover:bg-fancy-dark/50" size="xl" variant="foyer"
							:disabled="!stepper?.hasPrev" @click="stepper?.prev()">
							Back
						</UButton>
						<UButton class="disabled:opacity-0" size="xl" variant="foyer" :disabled="!stepper?.hasNext"
							@click="activeStep === 'overview' ? stepper?.next() : startGame()">
							{{ activeStep === "overview" ? "Next" : "Start" }}
						</UButton>
					</div>
				</div>
			</template>
		</UStepper>
	</UContainer>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { StepperItem } from "@nuxt/ui";
import type { Player } from "#shared/types/game";

definePageMeta({ middleware: "auth" });

const route = useRoute();
const { user } = useUserSession();
const gameCode: string = String(route.params.code);
const toast = useToast();

let settings = ref<Game>();
let players = ref<Player[]>();

const { data: companies } = await useFetch<Company[]>(
	() => `/api/game/${gameCode}/companies`,
	{ default: () => [] },
);

//
// const players = computed<UserSummary[]>(() => {
// 	const playersById = new Map<string, UserSummary>();
//
// 	for (const company of companies.value) {
// 		const id = String(company.userId);
//
// 		playersById.set(id, {
// 			id,
// 			name:
// 				id === String(user.value?.id)
// 					? (user.value?.name ?? `Player ${id}`)
// 					: `Player ${id}`,
// 		});
// 	}
//
// 	return [...playersById.values()];
// });

const stepper_items = ref<StepperItem[]>([
	{
		title: "Foyer Setup",
		value: "overview",
		icon: "i-myOwn-users",
	},
	{
		title: "Company Setup",
		value: "company-setup",
		icon: "i-myOwn-building-complex",
	},
	{
		title: "Game Start",
		value: "game-start",
		icon: "i-myOwn-gamepad-2",
	},
]);
const stepper = useTemplateRef("stepper");
const activeStep = ref("overview");
async function startGame() {
	try {
		await $fetch(`/api/game/${gameCode}/start`, { method: "POST" });
	} catch (error: any) {
		console.log(`error: ${error.message}`);
		toast.add({
			title: "Failure",
			description: error.statusMessage,
			color: "error",
		});
	}
	navigateTo(`/game/${gameCode}`);
}

/* Provisional */
try {
	settings = ref<Game>(
		await $fetch(`/api/game/${gameCode}`, { method: "GET" }),
	);
	if (settings.value.status === "ongoing") navigateTo(`/game/${gameCode}`);
	else if (settings.value.status === "done") navigateTo(`/results/${gameCode}`);
	// toast.add({
	// 	title: "Info",
	// 	description: "Game has already started",
	// 	color: "info",
	// });
	players = ref(
		await $fetch<Player[]>(`/api/game/${gameCode}/players`, { method: "GET" }),
	);
} catch (error: any) {
	console.log(`error: ${error.message}`);
	// toast.add({
	// 	title: "Failure",
	// 	description: error.statusMessage,
	// 	color: "danger",
	// });
	navigateTo("/play");
}
/**/

let socket: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let closedByUs = false;

async function connectWebSocket() {
	// Fresh Ticket on every connection attempt
	const ticket = await $fetch<{ ticket: string }>(
		`/api/foyer/${gameCode}/ws-ticket`,
		{ method: "POST" },
	);
	console.log("Obtained WebSocket ticket:", ticket.ticket);
	// Connect to WebSocket with the obtained ticket
	const protocol = location.protocol === "https:" ? "wss:" : "ws:";
	socket = new WebSocket(
		`${protocol}//${location.host}/ws/game?ticket=${ticket.ticket}`,
	);

	// Handle incoming events from the Websocket
	socket.onmessage = async (event) => {
		const payloadEvent = JSON.parse(event.data);
		console.log(`Event received: ${JSON.stringify(payloadEvent)}`);
		if (payloadEvent.type == "joined")
			players.value = await $fetch<Player[]>(`/api/game/${gameCode}/players`, { method: "GET" });
		else if (payloadEvent.type == "updated")
			settings.value = payloadEvent.game;
		else if (payloadEvent.type == "started")
			navigateTo(`/game/${gameCode}`);
	};

	// Handle WebSocket close event
	socket.onclose = () => {
		if (closedByUs) return;
		reconnectTimer = setTimeout(connectWebSocket, 2000);
	};
}
// Connect WebSocket on component mount
onMounted(connectWebSocket);
// Disconnect WebSocket on component unmount
onBeforeUnmount(() => {
	closedByUs = true;
	if (reconnectTimer) clearTimeout(reconnectTimer);
	socket?.close();
});

</script>
