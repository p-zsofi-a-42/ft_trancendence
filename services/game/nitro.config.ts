import { defineConfig } from "nitro";

export default defineConfig({
	serverDir: "./server",
	alias: {
		"@db": "/app/db",
		"@core": "/app/core",
		"@utils": "/app/utils",
	},
});
