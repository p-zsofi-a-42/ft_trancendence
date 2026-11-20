import { definePlugin } from "nitro";

// INFO: watch -n1 docker logs -n40 game_dev
export default definePlugin((nitroApp) => {
	console.log('Nitro plugin', nitroApp);
	// TODO: how should games be recovered after a crash? (e.g. if the server is restarted while a game is running)
	// TODO: at launch check for expired games and change their status to "done" (or reset their endsAt?)

	// console.time("testTimer");
	const timer = setInterval(async () => {
		// console.timeEnd("testTimer");
		// console.log("Testing the scheduler");

		// console.time("testTimer");
	}, 1000);
	// Will run when nitro is being closed
	nitroApp.hooks.hook("close", () => { clearInterval(timer) });
});

