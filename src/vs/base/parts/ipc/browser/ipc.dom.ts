/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IMessagePassingProtocol, IPCClient } from 'vs/base/parts/ipc/common/ipc';
import { Event } from 'vs/base/common/event';
import { VSBuffer } from 'vs/base/common/buffer';
import { IDisposable } from 'vs/base/common/lifecycle';

export class Protocol implements IMessagePassingProtocol {

	constructor(private port: MessagePort, readonly onMessage: Event<VSBuffer>) { }

	send(message: VSBuffer): void {
		this.port.postMessage(message.buffer);
	}

	dispose(): void {
		this.port.close();
	}
}

export class Client extends IPCClient implements IDisposable {

	private protocol: Protocol;

	static createProtocol(port: MessagePort): Protocol {
		const onMessage = Event.fromDOMEventEmitter(port, 'onmessage', e => {
			console.log("onmessage", e);

			return VSBuffer.wrap(e.data);
		});
		port.postMessage('vscode:hello');
		return new Protocol(port, onMessage);
	}

	constructor(port: MessagePort) {
		const protocol = Client.createProtocol(port);
		super(protocol, 'TContext TODO');
		this.protocol = protocol;
	}

	dispose(): void {
		this.protocol.dispose();
	}
}
