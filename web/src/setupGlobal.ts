const g = globalThis as any;

if (typeof g.global === 'undefined') {
	g.global = g;
}

if (typeof g.process === 'undefined') {
	g.process = { env: {} };
}

