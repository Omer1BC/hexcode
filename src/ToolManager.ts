import type { Tool, Message, Approval } from './messages.js';
import { EventEmitter } from 'events'
import { toolMapping } from './Tools.js';
export class ToolManager {
	private controller;
	private queue: Tool[];
	#emitter: EventEmitter

	constructor() {
		this.controller = new AbortController();
		this.queue = []
		this.#emitter = new EventEmitter()
	}

	get signal(): AbortSignal {
		return this.controller.signal;
	}

	get queueLength(): number {
		return this.queue.length;
	}

	enqueue(chunk: Tool): void {
		this.queue.push(chunk)
	}

	// completes tools
	async *executeTools(): AsyncIterable<Tool> {
		for (const tool of this.queue.filter((tool) => tool.status === 'pending')) {
			yield new Promise<Tool>(async (resolve) => {
				const res = await toolMapping[tool.function]!(tool.args)
				return resolve({ ...tool, status: 'complete', value: res })
			}

			)
		}

	}

	handleToolApproval(id: string, decision: Approval) {
		this.#emitter.emit(id,decision)
	}

	async awaitApproval() {
		return Promise.all(
			this.queue.map((tool) => new Promise((resolve) => {
				this.#emitter.once(tool.id, (decision: Approval) => {
					tool.status = decision === 'accept' ? 'pending' : 'rejected'
					resolve(null)
				})

			}))
		)
	}
	async *clearTools(): AsyncIterable<Tool> { }

	getToolRequest(_chunk: string): void { }


}
