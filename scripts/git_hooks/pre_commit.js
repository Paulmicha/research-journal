/**
 * @file
 * Implements pre-commit git hook.
 *
 * Rebuilds dynamic files before committing. If any versionned dynamic files
 * have changed, automatically stage them.
 */

const { exec } = require('child_process');

exec(
	"node scripts/before_build.js && git diff --name-only",
	(err, stdout, stderr) => {
		if (err) {
			console.log(stderr);
			console.log(err);
			return;
		}

		// Look for any versionned dynamic files. If changed, stage them.
		stdout.split("\n").map(diff_line => {
			if (!diff_line.length) {
				return;
			}
			// Whitelisted (update as needed).
			switch (diff_line) {
				case 'static/data/cache/page_routing_trails.json':
					exec(`git add ${diff_line}`);
					break;
			}
		})
	}
);
