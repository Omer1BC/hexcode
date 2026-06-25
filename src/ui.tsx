import React, {useState} from 'react';
import {Text, Box, useInput, useApp} from 'ink';
import { useStateSnapshotContext } from './contexts/stateSnapshotContext.js';
import type { History, Tool } from './messages.js';

const ToolBubble = ({tool, focused, onDecision}: {tool: Tool, focused: boolean, onDecision: (id: string, decision: 'accept' | 'reject') => void}) => {
	const statusColor = tool.status === 'complete' ? 'green' : tool.status === 'rejected' ? 'red' : 'gray'
	return (
		<Box flexDirection="column" marginBottom={1} borderStyle={focused ? 'round' : undefined} borderColor="yellow">
			<Text color="yellow" bold>
				⚙ {`${tool.function} (${JSON.stringify(tool.args)})`}<Text dimColor>{tool.time}</Text>{' '}
				<Text color={statusColor}>[{tool.status}]</Text>
			</Text>
			{tool.status === 'loaded' && focused && (
				<Text dimColor>  [A] Accept  [R] Reject</Text>
			)}
			{tool.value ? <Text dimColor>{tool.value}</Text> : null}
		</Box>
	)
}

const Bubble = ({msg}: {msg: History}) => (
	<Box flexDirection="column" marginBottom={1}>
		<Text color={msg.role === 'user' ? 'blueBright' : 'green'} bold>
			{msg.role === 'user' ? 'You' : 'AI'} <Text dimColor>{msg.time}</Text>
		</Text>
		<Text color={msg.role === 'user' ? 'blueBright' : 'white'}>{msg.value}</Text>
	</Box>
);

export const App = () => {
	const {exit} = useApp();
	const [input, setInput] = useState('');
	const [focusedToolIndex, setFocusedToolIndex] = useState(0)
	const {agent, history} = useStateSnapshotContext()

	const pendingTools = history.filter((msg): msg is Tool => msg.role === 'tool' && msg.status === 'loaded')

	useInput((char, key) => {
		if (key.escape) {
			agent.model.abort()
			return;
		}

		if (pendingTools.length > 0) {
			if (key.upArrow) { setFocusedToolIndex(i => Math.max(0, i - 1)); return }
			if (key.downArrow) { setFocusedToolIndex(i => Math.min(pendingTools.length - 1, i + 1)); return }
			const focused = pendingTools[focusedToolIndex]
			if (char === 'a' && focused) { agent.toolManager.handleToolApproval(focused.id, 'accept'); return }
			if (char === 'r' && focused) { agent.toolManager.handleToolApproval(focused.id, 'reject'); return }
			return
		}

		if (key.return) {
			const trimmedInput = input.trim()
			setInput('')
			if (trimmedInput) agent.run(trimmedInput)
			return;
		}
		if (key.backspace || key.delete) { setInput(prev => prev.slice(0, -1)); return }
		if (!key.ctrl && !key.meta) { setInput(prev => prev + char) }
	});

	return (
		<Box flexDirection="column" width="100%">
			<Box flexDirection="column" paddingX={1} paddingY={1} minHeight={18}>
				{history.map((msg) => (
					msg.role === 'tool'
						? <ToolBubble key={msg.id} tool={msg} focused={pendingTools[focusedToolIndex]?.id === msg.id} onDecision={(id, decision) => agent.toolManager.handleToolApproval(id, decision)} />
						: <Bubble key={msg.id} msg={msg} />
				))}
			</Box>

			<Box borderStyle="round" borderColor="blue" paddingX={1} width="100%">
				<Text>{input}</Text>
				<Text color="blue">▌</Text>
			</Box>

			<Box paddingX={1}>
				<Text dimColor>ESC to abort · Enter to send</Text>
			</Box>
		</Box>
	);
};
