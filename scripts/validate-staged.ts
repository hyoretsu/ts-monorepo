const staged = Bun.spawnSync(["git", "diff", "--cached", "--name-only"]).stdout.toString().split("\n");
// Complexity is an opt-in project invariant, shared by every agent through the normal hook.
const rootManifest = JSON.parse(await Bun.file("package.json").text());
const complexityInput = (path: string) =>
 (!/(?:^|\/)(?:node_modules|dist|build|out|generated|gen|target)\//.test(path) &&
  !/\.gen\.[^/]+$|\.d\.(?:ts|mts|cts)$/.test(path) &&
  /\.(?:[cm]?[jt]s|[jt]sx|rs)$/.test(path)) ||
 path === "cccc.toml" || path === "package.json";
if (rootManifest.scripts?.["check:complexity"] && staged.some(complexityInput)) {
 const result = Bun.spawnSync(["bun", "run", "check:complexity"], {
  stderr: "inherit", stdout: "inherit",
 });
 if (result.exitCode !== 0) process.exit(result.exitCode);
}

const manifests = [
	"backend/package.json",
	"frontend/package.json",
	"packages/sql/package.json",
	"packages/domain/package.json",
];
const packages = manifests.flatMap(path => {
	const result = Bun.spawnSync(["git", "show", `:${path}`]);
	if (result.exitCode) return [];
	const manifest = JSON.parse(result.stdout.toString());
	return [
		{
			dependencies: { ...manifest.dependencies, ...manifest.devDependencies },
			name: manifest.name as string,
			root: path.slice(0, -12),
		},
	];
});
const sharedChange = staged.some(path =>
	["package.json", "bun.lock", "turbo.jsonc", "scripts/validate-staged.ts"].includes(path),
);
const affected = new Set(
	packages
		.filter(pkg => sharedChange || staged.some(path => path.startsWith(pkg.root)))
		.map(pkg => pkg.name),
);
let changed = true;
while (changed) {
	changed = false;
	for (const pkg of packages)
		if (!affected.has(pkg.name) && Object.keys(pkg.dependencies).some(name => affected.has(name))) {
			affected.add(pkg.name);
			changed = true;
		}
}
if (affected.size) {
	const result = Bun.spawnSync(
		[
			"bun",
			"x",
			"--no-install",
			"turbo",
			"run",
			"check-types",
			...[...affected].flatMap(name => ["--filter", name]),
		],
		{ stderr: "inherit", stdout: "inherit" },
	);
	process.exit(result.exitCode);
}
