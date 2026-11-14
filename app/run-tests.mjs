// WHAT:    Runs the app's tests through Vitest, from a folder path spelled with a capital drive letter.
// IN:      Any extra arguments for Vitest, for example a test file name.
// OUT:     Vitest's output and exit code.
// USED BY: package.json ("test" and "check").
// RULES:   Keep it this small. It exists only for the Windows problem described below.
// TRAPS:   PITFALLS 10.
// OWNER:   Role B.

// On Windows a terminal can report its folder with a lowercase drive letter (c:\...), as VS Code's
// terminal often does. Vitest then loads two copies of itself and every test fails with
// "Cannot read properties of undefined (reading 'config')". Starting it from the same folder
// spelled C:\... avoids that.
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const capitalDrive = (path) => path.replace(/^[a-z]:/, (drive) => drive.toUpperCase());
const packageFile = createRequire(import.meta.url).resolve('vitest/package.json');
const cli = capitalDrive(join(dirname(packageFile), 'vitest.mjs'));
const result = spawnSync(process.execPath, [cli, 'run', ...process.argv.slice(2)], {
  cwd: capitalDrive(process.cwd()),
  stdio: 'inherit',
});
process.exit(result.status ?? 1);
