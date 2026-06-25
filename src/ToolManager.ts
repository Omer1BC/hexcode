import type { Tool, Approval } from './messages.js';
import type { History } from './messages.js';
import { EventEmitter } from 'events'
import { toolMapping } from './Tools.js';

export class ToolManager {
	private queue: string[];
	#emitter: EventEmitter

	constructor() {
		this.queue = []
		this.#emitter = new EventEmitter()
	}

	get queueLength(): number {
		return this.queue.length;
	}

	enqueue(chunk: Tool): void {
		this.queue.push(chunk.id)
	}

	clearQueue(): void {
		this.queue = []
	}

	handleToolApproval(id: string, decision: Approval): void {
		this.#emitter.emit(id, decision)
	}

	async *awaitApproval(signal?: AbortSignal): AsyncIterable<{id: string, decision: Approval}> {
		if (signal) {
			signal.addEventListener('abort', () => {
				for (const id of this.queue) this.#emitter.emit(id, 'reject')
			}, {once: true})
		}

		for (const id of this.queue) {
			const decision = await new Promise<Approval>(resolve => {
				this.#emitter.once(id, resolve)
			})
			yield {id, decision}
		}
	}

	async *executeTools(lookup: (id: string) => History | undefined): AsyncIterable<{id: string, result: string}> {
		for (const id of this.queue) {
			const entry = lookup(id)
			if (!entry || entry.role !== 'tool' || (entry as Tool).status !== 'pending') continue
			const tool = entry as Tool
			try {
				const result = await toolMapping[tool.function]!(tool.args)
				yield {id, result}
			} catch (error) {
				yield {id, result: error instanceof Error ? error.message : String(error)}
			}
		}
	}
}
