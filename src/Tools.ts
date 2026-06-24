import type { FunctionDeclaration } from '@google/genai';


export const definitions: FunctionDeclaration[] = [
	{
		name: 'roll_dice',
		description: 'Rolls a dice with the given number of sides and returns the result',
		parametersJsonSchema: {
			type: 'object',
			properties: {
				sides: { type: 'number', description: 'Number of sides on the dice' }
			},
			required: ['sides']
		}
	},
	{
		name: 'word_count',
		description: 'Counts the number of words in a given text',
		parametersJsonSchema: {
			type: 'object',
			properties: {
				text: { type: 'string', description: 'The text to count words in' }
			},
			required: ['text']
		}
	}
]

export const toolMapping: Record<string, (args: Record<string, unknown>) => Promise<string>> = {
	roll_dice: async (args) => {
		const sides = args.sides as number
		const result = Math.floor(Math.random() * sides) + 1
		return `Rolled a ${sides}-sided dice: ${result}`
	},
	word_count: async (args) => {
		const text = args.text as string
		const count = text.trim().split(/\s+/).filter(Boolean).length
		return `Word count: ${count}`
	}
}

