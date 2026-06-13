import React, {useState} from 'react';
import {render, Text, Box, useInput, useApp} from 'ink';
import {GoogleGenAI} from '@google/genai'


let controller = new AbortController()

type Role = 'user' | 'model';

type Message = {
	id: number;
	text: string;
	role: Role;
	time: string;
};

const client = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY ?? ""
});

const chat = client.chats.create({model: "gemini-3.5-flash"});

const getTime = () =>
	new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});

const Bubble = ({msg}: {msg: Message}) => (
	<Box flexDirection="column" marginBottom={1}>
		<Text color={msg.role === 'user' ? 'blueBright' : 'green'} bold>
			{msg.role === 'user' ? 'You' : 'AI'} <Text dimColor>{msg.time}</Text>
		</Text>
		<Text color={msg.role === 'user' ? 'blueBright' : 'white'}>{msg.text}</Text>
	</Box>
);

const App = () => {
	const {exit} = useApp();
	const [messages, setMessages] = useState<Message[]>([
	]);
	const [input, setInput] = useState('');


	const updateHistory =  async (stream : any) => {
		let started = false
		for await (const chunk of stream) {
			if (!started) {
				started = true
				setMessages((prev) => [
					...prev,
					{id: prev.length+1,text: "", role: 'model',time: getTime()}
				])
			}

			const delta = chunk.text ?? ''

			setMessages((prev) => {
				const updated = [...prev]
				const last = updated[updated.length-1]
				if (!last) return prev

				updated[updated.length-1] = {
					...last,
					text: last.text + delta
				};

				return updated
			})
		}
	}

	async function * streamResponse(userInput: string) {
		const signal = controller.signal

		try {
			const stream = await chat.sendMessageStream({
				message: userInput,
				config: {abortSignal: signal},
			});

			for await (const chunk of stream) {
				yield chunk
			}
		}
		catch (error) {
			if (!signal.aborted) {
				throw error
			}
		}
		if (signal.aborted) {
			yield {text: "Interrupted"}
		}
	}
	// write me a 3 paragraph essay about arcane
	const handleQuery = async (userInput: string) => {
		const trimmedInput = userInput.trim()
		setInput('')

		if (trimmedInput) {
		setMessages((prev) => [
			...prev,
			{id: prev.length+1,text: trimmedInput, role: 'user',time: getTime()}
		])
			const stream = streamResponse(trimmedInput)
			updateHistory(stream)
		}


	}

	useInput(async (char, key) => {
		if (key.escape) {
			// exit();
			controller.abort()
			controller = new AbortController()
			return;
		}
		if (key.return) {
			await handleQuery(input)
			return;
		}
		if (key.backspace || key.delete) {
			setInput(prev => prev.slice(0, -1));
			return;
		}
		if (!key.ctrl && !key.meta) {
			setInput(prev => prev + char);
		}
	});

	const visible = messages.slice(-8);

	return (
		<Box flexDirection="column" width="100%">
			{/* Chat area */}
			<Box
				flexDirection="column"
				paddingX={1}
				paddingY={1}
				minHeight={18}
			>
				{visible.map(msg => (
					<Bubble key={msg.id} msg={msg} />
				))}
			</Box>

			{/* Input bar */}
			<Box borderStyle="round" borderColor="blue" paddingX={1} width="100%">
				<Text>{input}</Text>
				<Text color="blue">▌</Text>
			</Box>

			<Box paddingX={1}>
				<Text dimColor>ESC to quit · Enter to send</Text>
			</Box>
		</Box>
	);
};

render(<App />);
