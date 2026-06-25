import { GoogleGenAI } from '@google/genai';
import type { RefObject } from 'react';
import type { Tool, Message, History } from './messages.js';
import { time, newId } from './metadata.js';
import { Model } from './Model.js';
import type { Content, FunctionCall, GenerateContentResponse } from '@google/genai';
import { definitions } from './Tools.js';

const MODEL =  "gemini-3.1-flash-lite"
export class GeminiModel extends Model<Content> {


	#client: GoogleGenAI;

	constructor() {
		super();
		this.#client = new GoogleGenAI({
			apiKey: process.env.GOOGLE_API_KEY ?? ""
		});


	}

	async *fetchAsNormalizedStream(historyRef: RefObject<History[]>): AsyncIterable<Tool | Message> {
		try {
			const stream =  await this.#client.models.generateContentStream({
				model: MODEL,
				contents: this.normalizeHistory(historyRef.current),
				config: {abortSignal: super.signal,
					tools:[{functionDeclarations: definitions}] 
				}

		 	})
			const respId = newId()
			for await (const chunk of stream ) {
				if (chunk.functionCalls?.length)
					for (const toolCall of chunk.functionCalls) {
						yield this._normalizeToolChunk(newId(),toolCall)
					}
				else if (chunk.text) {
					yield this._normalizeResponseChunk(respId,chunk)
				}
			}
		}
		catch (error) {
			throw error;
		}
	}

	_normalizeResponseChunk(id:string,chunk: GenerateContentResponse): Message {
		return {id,role: 'model',value: chunk.text!,time: time()}
	}

	_normalizeToolChunk(id: string,chunk:FunctionCall) : Tool {
		return { id, status: 'loaded', role: 'tool', time: time(), function: chunk.name!, args: chunk.args!, controller: new AbortController(), value: '' }
	}

	normalizeHistory(history: History[]): Content[] {
		return this.filterHistory(history)
			.filter(elem => elem.role !== 'tool' || (elem as Tool).status === 'complete')
			.flatMap((elem): Content[] => {
				switch (elem.role) {
					case 'user':
					case 'model':
						return [{ role: elem.role, parts: [{ text: elem.value }] }];
					case 'tool':
						return [
							{ role: 'model', parts: [{ functionCall: { name: elem.function, args: elem.args } }] },
							{ role: 'user', parts: [{ functionResponse: { name: elem.function, response: { result: elem.value } } }] }
						];
				}
			});
	}






	


}
