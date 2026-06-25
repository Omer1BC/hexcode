import type { RefObject } from 'react';
import type { Tool, Message, History } from './messages.js';

export abstract class Model<APIMessage> {
	protected controller: AbortController = new AbortController();

	// must time stamp responses
	abstract fetchAsNormalizedStream(historyRef: RefObject<History[]>): AsyncIterable<Tool | Message>;

	get signal(): AbortSignal {
		return this.controller.signal;
	}

	abort(): void {
		this.controller.abort();
		this.controller = new AbortController();
	}

	protected filterHistory(history: History[]): History[] {
		return history.filter(h => h.role !== 'terminal');
	}

	abstract normalizeHistory(history: History[]): APIMessage[];

	abstract _normalizeResponseChunk(id: string, chunk: unknown): Message;
	abstract _normalizeToolChunk(id: string, chunk: unknown): Tool;

}
