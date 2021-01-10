/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ipcRenderer } from 'vs/base/parts/sandbox/electron-sandbox/globals';
import { Event, Emitter } from 'vs/base/common/event';
import { IDisposable, toDisposable } from 'vs/base/common/lifecycle';
import { Client } from 'vs/base/parts/ipc/browser/ipc.dom';
import { ClientConnectionEvent, IPCServer } from 'vs/base/parts/ipc/common/ipc';

export class Server extends IPCServer {

	private static readonly Clients = new Map<MessagePort, IDisposable>();

	private static getOnDidClientConnect(): Event<ClientConnectionEvent> {

		const onHello = Event.fromNodeEventEmitter<MessagePort>(ipcRenderer, 'vscode:sharedProcessAcceptConnection', ({ ports }) => ports[0]);

		return Event.map(onHello, port => {
			console.log("hello from ", port);
			const client = Server.Clients.get(port);

			if (client) {
				client.dispose();
			}

			const onDidClientReconnect = new Emitter<void>();
			Server.Clients.set(port, toDisposable(() => onDidClientReconnect.fire()));

			return { protocol: Client.createProtocol(port), onDidClientDisconnect: Event.None };
		});
	}

	constructor() {
		super(Server.getOnDidClientConnect());
	}
}
