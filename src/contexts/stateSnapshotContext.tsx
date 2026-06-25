import React, {createContext, useContext, useState, useRef} from 'react';
import type { History } from '@src/messages.js';
import { Agent } from '@src/Agent.js';

type stateSnapshotContext = {
	agent: Agent
	history: History[]
}

const StateSnapshotContext = createContext<stateSnapshotContext | null>(null)

export function useStateSnapshotContext() {
	const ctx = useContext(StateSnapshotContext)
	if (!ctx) throw new Error("Expecting a provider for StateSnapshotContext")
	return ctx
}

export function SnapshotContextProvider({children}: {children: React.ReactNode}) {
	const [history, setHistory] = useState<History[]>([])
	const historyRef = useRef<History[]>([])
	const agentRef = useRef<Agent>(new Agent(setHistory, historyRef))

	return <StateSnapshotContext.Provider value={{agent: agentRef.current, history}}>
		{children}
	</StateSnapshotContext.Provider>
}
