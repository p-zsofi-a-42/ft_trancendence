import { definePlugin } from "nitro";

// watch -n1 docker logs -n40 game_dev
export default definePlugin((nitroApp) => {
  console.log('Nitro plugin', nitroApp);
	console.time("testTimer");
	const timer = setInterval(async () => {
		console.timeEnd("testTimer");
		console.log("Testing the scheduler");
		console.time("testTimer");
	}, 1000);
	// Will run when nitro is being closed
	nitroApp.hooks.hook("close", () => {clearInterval(timer)});
});
