/**
 * @license
 * Copyright 2016 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * DISCLAIMER
 * a part of code borrow from lighthouse/chrome-finder.ts https://goo.gl/SWI1ES
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const execFileSync = require('child_process').execFileSync;
const lsregister = require('lsregister');

function canAccess(file) {
	try {
		fs.accessSync(file);
		return true;
	} catch (err) {
		return false;
	}
}

function dasherize(p) {
	return path.basename(p).toLocaleLowerCase().replace(/ /gi, '-');
}

function compare(src, target, priorities) {
	let srcWeight = priorities.find(m => new RegExp(m.regex).test(src));
	let targetWeight = priorities.find(m => new RegExp(m.regex).test(target));

	srcWeight = srcWeight ? srcWeight.weight : -1;
	targetWeight = targetWeight ? targetWeight.weight : -1;

	return srcWeight > targetWeight ? 1 : (srcWeight < targetWeight) ? -1 : 0;
}

function setChrome(chromes, executable, priorities) {
	const chromeName = dasherize(executable);
	if (!chromes[chromeName] && chromes[chromeName] !== executable) {
		if (canAccess(executable)) {
			if (compare(chromes[chromeName], executable, priorities) < 0) {
				chromes[chromeName] = executable;
			}
		}
	}

	return chromes;
}

const finders = {
	darwin: chromes => {
		const priorities = [{
			regex: `^/Applications`,
			weight: 100
		}, {
			regex: `^${os.homedir()}/Applications`,
			weight: 50
		}, {
			regex: `^/Volumes`,
			weight: 1
		}];

		return lsregister.dump().then(services => {
			services.reduce((p, s) => {
				if (/google chrome( canary)?.app$|chromium.app$/i.test(s.path)) {
					p.push(s);
				}
				return p;
			}, []).forEach(c => {
				const executable = path.join(c.path, c.executable);
				chromes = setChrome(chromes, executable, priorities);
			});

			return chromes;
		});
	},
	linux: chromes => {
		const priorities = [{
			regex: /chrome-wrapper$/,
			weight: 51
		}, {
			regex: /google-chrome-stable$/,
			weight: 50
		}, {
			regex: /google-chrome$/,
			weight: 49
		}];

		return new Promise(resolve => {
			[
				'google-chrome-stable',
				'google-chrome'
			].forEach(executable => {
				try {
					executable = execFileSync('which', [executable]).toString().split(/\r?\n/)[0];
					chromes = setChrome(chromes, executable, priorities);
				} catch (err) {
					resolve(chromes);
				}
			});

			resolve(chromes);
		});
	},
	win32: chromes => {
		const prefixes = [
			process.env.LOCALAPPDATA,
			process.env.PROGRAMFILES,
			process.env['PROGRAMFILES(X86)']
		];

		return new Promise(resolve => {
			prefixes.forEach(prefix => {
				const executable = path.join(prefix, '\\Google\\Chrome SxS\\Application\\chrome.exe');
				if (canAccess(executable)) {
					chromes['google-chrome-canary'] = executable;
				}
			});

			prefixes.forEach(prefix => {
				const executable = path.join(prefix, '\\Google\\Chrome\\Application\\chrome.exe');
				if (canAccess(executable)) {
					chromes['google-chrome-canary'] = executable;
				}
			});

			resolve(chromes);
		});
	}
};

function run() {
	const chromes = {
		'google-chrome': undefined,
		'google-chrome-canary': undefined,
		chromium: undefined
	};

	const finder = finders[os.platform()];

	if (!finder) {
		throw new Error(`${os} is not supported`);
	}

	return finder(chromes);
}

module.exports = run;
