import type { RefObject } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { History, Tool, Message } from './messages.js';
import { MessageManager } from './MessageManager.js';
import { ToolManager } from './ToolManager.js';
import { GeminiModel } from './GeminiModel.js';
import type { Model } from './Model.js';

export class Agent {
	model: Model<unknown>
	toolManager: ToolManager
	messageManager: MessageManager

	constructor(setHistory: Dispatch<SetStateAction<History[]>>, historyRef: RefObject<History[]>) {
		this.model = new GeminiModel()
		this.toolManager = new ToolManager()
		this.messageManager = new MessageManager(setHistory, historyRef)
	}

	run(userInput: string): void {
		this.messageManager.processStream(this.createStream(userInput))
	}

	async *createStream(input: string): AsyncIterable<Tool | Message> {
		yield this.messageManager.userMessage(input)

		while (true) {
			const stream = this.model.fetchAsNormalizedStream(this.messageManager.historyRef)
			try {
				for await (const chunk of stream) {
					if (chunk.role === 'tool') this.toolManager.enqueue(chunk)
					yield chunk
				}
			} catch (error) {
				yield this.messageManager.terminalMessage(error instanceof Error ? error.message : String(error))
				return
			}

			if (!this.toolManager.queueLength) break

			const approvalSignal = this.model.signal

			for await (const {id, decision} of this.toolManager.awaitApproval(approvalSignal)) {
				const tool = this.messageManager.getById(id) as Tool
				yield {...tool, status: decision === 'accept' ? 'pending' : 'rejected'}
			}

			for await (const {id, result} of this.toolManager.executeTools((id) => this.messageManager.getById(id))) {
				const tool = this.messageManager.getById(id) as Tool
				yield {...tool, status: 'complete', value: result}
			}

			this.toolManager.clearQueue()

			if (approvalSignal.aborted) break
		}
	}
}
