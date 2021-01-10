/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Client } from 'vs/base/parts/ipc/browser/ipc.dom';
import { IChannel, IServerChannel, getDelayedChannel } from 'vs/base/parts/ipc/common/ipc';
import { IMainProcessService } from 'vs/platform/ipc/electron-sandbox/mainProcessService';
import { registerSingleton } from 'vs/platform/instantiation/common/extensions';
import { createDecorator } from 'vs/platform/instantiation/common/instantiation';
import { ipcRenderer } from 'vs/base/parts/sandbox/electron-sandbox/globals';
import { timeout } from 'vs/base/common/async';

export const ISharedProcessService = createDecorator<ISharedProcessService>('sharedProcessService');

export interface ISharedProcessService {

	readonly _serviceBrand: undefined;

	getChannel(channelName: string): IChannel;
	registerChannel(channelName: string, channel: IServerChannel<string>): void;

	whenSharedProcessReady(): Promise<void>;
	toggleSharedProcessWindow(): Promise<void>;
}

export class SharedProcessService implements ISharedProcessService {

	declare readonly _serviceBrand: undefined;

	private withSharedProcessConnection: Promise<Client>;
	private sharedProcessMainChannel: IChannel;

	constructor(
		@IMainProcessService mainProcessService: IMainProcessService
	) {
		this.sharedProcessMainChannel = mainProcessService.getChannel('sharedProcess'); // TODO use channel receiver/sender?

		const { port1, port2 } = new MessageChannel();

		this.withSharedProcessConnection = (async () => {
			await this.whenSharedProcessReady();

			ipcRenderer.postMessage('vscode:sharedProcessConnect', null, [port2]); // TODO need to await success here somehow!

			await timeout(5000);

			return new Client(port1);
		})();
	}

	whenSharedProcessReady(): Promise<void> {
		return this.sharedProcessMainChannel.call('whenSharedProcessReady');
	}

	getChannel(channelName: string): IChannel {
		return getDelayedChannel(this.withSharedProcessConnection.then(connection => connection.getChannel(channelName)));
	}

	registerChannel(channelName: string, channel: IServerChannel<string>): void {
		this.withSharedProcessConnection.then(connection => connection.registerChannel(channelName, channel));
	}

	toggleSharedProcessWindow(): Promise<void> {
		return this.sharedProcessMainChannel.call('toggleSharedProcessWindow');
	}
}

registerSingleton(ISharedProcessService, SharedProcessService, true);
