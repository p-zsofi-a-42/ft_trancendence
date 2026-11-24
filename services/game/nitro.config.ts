import { defineConfig } from "nitro";
import { resolve } from "node:path";

const root = (p: string) => resolve(import.meta.dirname, p);

export default defineConfig({
	serverDir: "./server",
	alias: {
		"@db": root("db"),
		"@core": root("core"),
		"@utils": root("utils"),
	},
	plugins: ["plugins/scheduler.ts"],
});
