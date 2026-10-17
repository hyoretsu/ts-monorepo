const staged = Bun.spawnSync(["git", "diff", "--cached", "--name-only"]).stdout.toString().split("\n");
const manifests = ["backend/package.json", "frontend/package.json", "packages/sql/package.json", "packages/domain/package.json"];
const packages = manifests.flatMap(path => {
 const result = Bun.spawnSync(["git", "show", `:${path}`]);
 if (result.exitCode) return [];
 const manifest = JSON.parse(result.stdout.toString());
 return [{ root: path.slice(0,-12), name: manifest.name as string, dependencies: { ...manifest.dependencies, ...manifest.devDependencies } }];
});
const affected = new Set(packages.filter(pkg => staged.some(path => path.startsWith(pkg.root))).map(pkg => pkg.name));
let changed = true;
while (changed) {
 changed = false;
 for (const pkg of packages) if (!affected.has(pkg.name) && Object.keys(pkg.dependencies).some(name => affected.has(name))) { affected.add(pkg.name); changed = true; }
}
if (affected.size) {
 const result = Bun.spawnSync(["bun", "x", "--no-install", "turbo", "run", "check-types", ...[...affected].flatMap(name => ["--filter", name])], { stdout: "inherit", stderr: "inherit" });
 process.exit(result.exitCode);
}
