/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ipcMain, MessagePortMain } from 'electron';
import { createDecorator } from 'vs/platform/instantiation/common/instantiation';

export const ISharedProcessMainService = createDecorator<ISharedProcessMainService>('sharedProcessMainService');

export interface ISharedProcessMainService {

	readonly _serviceBrand: undefined;

	whenSharedProcessReady(): Promise<void>;
	toggleSharedProcessWindow(): Promise<void>;
}

export interface ISharedProcess {
	whenReady(): Promise<void>;
	connect(port: MessagePortMain): Promise<void>;
	toggle(): void;
}

export class SharedProcessMainService implements ISharedProcessMainService {

	declare readonly _serviceBrand: undefined;

	constructor(private sharedProcess: ISharedProcess) {
		ipcMain.on('vscode:sharedProcessConnect', e => {
			sharedProcess.connect(e.ports[0]);
		});
	}

	whenSharedProcessReady(): Promise<void> {
		console.log("whenSharedProcessReady", new Error().stack)
		return this.sharedProcess.whenReady();
	}

	async toggleSharedProcessWindow(): Promise<void> {
		return this.sharedProcess.toggle();
	}
}
