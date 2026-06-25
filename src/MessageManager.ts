
import type {Dispatch, SetStateAction, RefObject} from 'react';
import type { Message, Tool, History } from './messages.js';
import { time, newId } from './metadata.js';

export class MessageManager {

	#setHistory: Dispatch<SetStateAction<History[]>>;
	#messageStore: Map<string,History>;
	historyRef: RefObject<History[]>;

	constructor(setHistory: Dispatch<SetStateAction<History[]>>, historyRef: RefObject<History[]>) {
		this.#setHistory = setHistory
		this.#messageStore = new Map<string,History>()
		this.historyRef = historyRef
	}

	getById(id: string): History | undefined {
		return this.#messageStore.get(id)
	}

	async processStream(stream: AsyncIterable<Tool | Message>): Promise<void> {
		for await (const chunk of stream) {
			this.updateHistory(chunk)
		}
	}

	updateHistory(chunk: Tool | Message) {
		const snapshot = this._appendOrExtend(chunk)
		this.historyRef.current = snapshot

		this.#setHistory(
		snapshot)
	}

	_appendOrExtend(chunk: Tool | Message) {
		if (this.#messageStore.has(chunk.id)) {
			return this._extend(chunk)
		} else {
			return this._append(chunk)
		}
	}

	_append(chunk: Tool | Message) {
		this.#messageStore.set(chunk.id, chunk)
		return [...this.#messageStore.values()]
	}

	_extend(chunk: Tool | Message) {
		const target = this.#messageStore.get(chunk.id)!
		this.#messageStore.set(chunk.id, {...chunk, value: target.value + chunk.value})
		return [...this.#messageStore.values()]
	}

	terminalMessage(error: string): Message {
		return {id: newId(), role: 'terminal', value: error, time: time()};
	}

	userMessage(input: string): Message {
		return {id: newId(), role: 'user', value: input, time: time()};
	}
}
