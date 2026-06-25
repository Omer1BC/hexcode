import type { FunctionDeclaration } from '@google/genai';
import { spawn,exec } from 'child_process';
import {readFile, writeFile} from 'fs/promises'
import { promisify } from 'util';

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
	},
	{
		name: "read",
		description: "read the contents of a file",
		parametersJsonSchema : {
			type: 'object',
			properties: {
				path: {type: "string", description: 'path of the file to read'}
			},
			required: ['path']
		}
	},
	{
		name: 'write',
		description: 'Replaces the original file with contents with content to a file',
		parametersJsonSchema : {
			type: 'object',
			properties: {
				path : {type: 'string', description: 'path of the file to write'},
				content: {type: 'string', description: 'content to write'}
			},
			required: ["path", "content"]
		}
	},
	{
		name: 'powerShell',
		description: 'execute a command in powershell',
		parametersJsonSchema : {
			type: 'object',
			properties : {
				command: {type: 'string', description: "command as a complete string eg 'ls -a' "},

			},
			required: ["command"]
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
	},
	read: async (args)  => {
		const path = args.path as string 
		return await readFile(path,'utf-8')

	},
	write: async(args) => {
		const path = args.path as string 
		await writeFile(path,args.content as string)
		return "success!"
	},
	powerShell: async(args) => {
		// const process = spawn(args.command as string,args.arguments as string[],{shell: true})
		// let result = ""
		// process.stdout.on('data',(data) =>{
		// 	result += data.toString()
		// })
		const promise = promisify(exec)

		const {stdout,stderr} = await promise(args.command as string)

		return ` ${args.command} | ${stdout}`
	}

	
}

