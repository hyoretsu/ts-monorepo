/** All in-memory arrays a unit-test kernel shares. One MockStore == one isolated test world. */
export type MockStore = {};

export function createMockStore(): MockStore {
	return {
		auditLogs: [],
		bankrollEvents: [],
		bets: [],
		breaches: [],
		challenges: [],
		phases: [],
		planContexts: new Map(),
		planNames: new Map(),
		planProgressions: new Map(),
		rules: { kinds: [], planRules: [] },
	};
}
