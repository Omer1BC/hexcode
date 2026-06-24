export type Role = 'user' | 'model' | 'terminal';
export type Status = 'loaded' | 'pending' | 'complete' | 'rejected'
export type Approval = 'accept' | 'reject'
export interface Message {
	id: string;
	role: Role;
	value: string;
	time: string;
}


export interface Tool {
	id: string;
	role: 'tool';
	status: Status;
	function: string;
	time: string;	
	args: Record<string, unknown>;
	controller: AbortController;
	value: string
}



export type Chunk = {
	id: string;
	text: string;

}

export type History = Message | Tool

