/**
*
*   Original from node-ole-doc module.
*   Refer to the LICENSE.md file.
*
**/

import * as fs from 'fs';
import * as util from 'util';
import { EventEmitter } from 'events';
import * as es from 'event-stream';

const HEADER_OLE_ID = [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1];


interface IDocument {
	_header: Header;
	_readSectors: (secIds: number[]) => Promise<Buffer>;
	_readShortSector: (secId: number) => Promise<Buffer>;
	_readSector: (secId: number) => Promise<Buffer>;
	_SAT: AllocationTable;
	_SSAT: AllocationTable;
}

class Header {
	public secSize = 0;
	public shortSecSize = 0;
	public SATSize = 0;
	public dirSecId: number = 0;
	public shortStreamMax: number = 0;
	public SSATSecId: number = 0;
	public SSATSize: number = 0;
	public MSATSecId: number = 0;
	public MSATSize: number = 0;
	public partialMSAT: number[] = [];
	
	public load(buffer: Buffer) {
		for(let i = 0; i < 8; i++) {
			if(HEADER_OLE_ID[i] !== buffer[i]) return false;
		}
		this.secSize        = 1 << buffer.readInt16LE( 30 );  // Size of sectors
		this.shortSecSize   = 1 << buffer.readInt16LE( 32 );  // Size of short sectors
		this.SATSize        =      buffer.readInt32LE( 44 );  // Number of sectors used for the Sector Allocation Table
		this.dirSecId       =      buffer.readInt32LE( 48 );  // Starting Sec ID of the directory stream
		this.shortStreamMax =      buffer.readInt32LE( 56 );  // Maximum size of a short stream
		this.SSATSecId      =      buffer.readInt32LE( 60 );  // Starting Sec ID of the Short Sector Allocation Table
		this.SSATSize       =      buffer.readInt32LE( 64 );  // Number of sectors used for the Short Sector Allocation Table
		this.MSATSecId      =      buffer.readInt32LE( 68 );  // Starting Sec ID of the Master Sector Allocation Table
		this.MSATSize       =      buffer.readInt32LE( 72 );  // Number of sectors used for the Master Sector Allocation Table

		// The first 109 sectors of the MSAT
		for(let i = 0; i < 109; i++) {
			this.partialMSAT[i] = buffer.readInt32LE( 76 + i * 4 );
		}
		return true;
	}
}

class AllocationTable {
	private static SecIdFree       = -1;
	private static SecIdEndOfChain = -2;
	private static SecIdSAT        = -3;
	private static SecIdMSAT       = -4;

	private _doc: IDocument;
	private _table: number[] = [];

	constructor(doc: IDocument) {
		this._doc = doc;
	}
	
	public async load(secIds: any) {
		const doc = this._doc;
		
		let buffer = await doc._readSectors(secIds);
		for(let i = 0, ii = buffer.length / 4; i < ii; i++) {
			this._table[i] = buffer.readInt32LE(i * 4);
		}
	}
	
	public getSecIdChain(startSecId: number) {
		let secId = startSecId, secIds = [];
		while(secId !== AllocationTable.SecIdEndOfChain) {
			secIds.push(secId); secId = this._table[secId];
		}
		return secIds;
	}
}

interface IEntry {
	name: Readonly<string>;
	type: Readonly<number>;
	nodeColor: Readonly<number>;
	left: Readonly<number>;
	right: Readonly<number>;
	storageDirId: Readonly<number>;
	secId: Readonly<number>;
	size: Readonly<number>;
	storages: {[key: string]: IEntry};
	streams: {[key: string]: IEntry};
}
class DirectoryTree {
	private static EntryTypeEmpty   = 0;
	private static EntryTypeStorage = 1;
	private static EntryTypeStream  = 2;
	private static EntryTypeRoot    = 5;
	
	private static NodeColorRed   = 0;
	private static NodeColorBlack = 1;
	
	private static Leaf = -1;

	private _doc: IDocument;
	private _entries: IEntry[] = [];
	public root: IEntry = {
		name: '',
		type: 0,
		nodeColor: 0,
		left: 0,
		right: 0,
		storageDirId: 0,
		secId: 0,
		size: 0,
		storages: {},
		streams: {}
	};

	constructor(doc: IDocument) {
		this._doc = doc;
	}

	public async load(secIds: any) {
		const doc = this._doc;
		const buffer = await doc._readSectors(secIds) as Buffer;
		const count = buffer.length / 128;

		let set = false;
		for(let i = 0; i < count; i++) {
			let offset = i * 128, nameLength = buffer.readInt16LE(64 + offset);
			if(nameLength) nameLength--;

			let entry: IEntry = {
				name: buffer.toString('utf16le', offset, nameLength + offset),
				type: buffer.readInt8(offset + 66),
				nodeColor: buffer.readInt8(offset + 67),
				left: buffer.readInt32LE(offset + 68),
				right: buffer.readInt32LE(offset + 72),
				storageDirId: buffer.readInt32LE(offset + 76),
				secId: buffer.readInt32LE(offset + 116),
				size: buffer.readInt32LE(offset + 120),
				storages: {},
				streams: {}
			};
			if(!set && entry.type === DirectoryTree.EntryTypeRoot) {
				set = true; 
				this.root = entry;
			}
			this._entries[i] = entry;
		}

		this._buildHierarchy(this.root);
	}

	private _getChildIds(storageEntry: IEntry) {
		const childIds: number[] = [];
 
		const visit = (visitEntry: IEntry ) => {
			 if ( visitEntry.left !== DirectoryTree.Leaf ) {
					childIds.push( visitEntry.left );
					visit(this._entries[visitEntry.left]);
			 }
			 if ( visitEntry.right !== DirectoryTree.Leaf ) {
					childIds.push( visitEntry.right );
					visit(this._entries[visitEntry.right] );
			 }
		};
 
		childIds.push(storageEntry.storageDirId );
		const rootChildEntry = this._entries[storageEntry.storageDirId];
		visit( rootChildEntry );
		return childIds;
 }
	
	private _buildHierarchy(storageEntry: IEntry ) {
		const childIds = this._getChildIds( storageEntry );
	
		childIds.forEach((childId) => {
			const childEntry = this._entries[childId],
				name = childEntry.name;
			if(childEntry.type === DirectoryTree.EntryTypeStorage) {
				storageEntry.storages[name] = childEntry;
			} else if(childEntry.type === DirectoryTree.EntryTypeStream) {
				storageEntry.streams[name] = childEntry;
			}
		});
	
		// tslint:disable-next-line: forin
		for(const key in storageEntry.storages) {
			this._buildHierarchy(storageEntry.storages[key]);
		}
	}
}

class Storage {
	private _doc: IDocument;
	private _dirEntry: IEntry;

	constructor(doc: IDocument, dirEntry: IEntry) {
  	this._doc = doc;
		 this._dirEntry = dirEntry;
	}

	public storage(storageName: string) {
		const storageEntry = this._dirEntry.streams[storageName];
		if (!storageEntry) return null;

		return new Storage(this._doc, storageEntry);
	}

	public stream(streamName: string) {
		const streamEntry = this._dirEntry.streams[streamName];
		if (!streamEntry) return null;

		const doc  = this._doc;
		let bytes = streamEntry.size;

		let allocationTable = doc._SAT;
		let shortStream = false;
		if ( bytes <= doc._header.shortStreamMax ) {
			shortStream = true;
			allocationTable = doc._SSAT;
		}

		const secIds = allocationTable.getSecIdChain( streamEntry.secId );

		const stream = es.readable((i: number, callback: () => void) => {
			if ( i >= secIds.length ) {
				stream.emit('end');
				return;
			}

			(async () => {
				let buffer = shortStream ? 	await doc._readShortSector(secIds[i]) :
																		await doc._readSector(secIds[i]);
				if (bytes < buffer.length) buffer = buffer.slice( 0, bytes );
			
				bytes -= buffer.length;
				stream.emit('data', buffer);
				callback();
			})();
		});

		return stream;
	}
}


// function Stream( doc, dirEntry ) {
//   this._doc = doc;
//   this._dirEntry = dirEntry;
// };

class OleCompoundDoc extends EventEmitter implements IDocument {
	private _filename: string;
	private _skipBytes: number;
	private _customHeaderCallback: ((buffer: Buffer) => boolean)|null = null;

	private _MSAT: number[] = [];

	private _fd: number = 0;
	public _header: Header;
	public _SAT: AllocationTable;
	public _SSAT: AllocationTable;
	public _directoryTree: DirectoryTree;

	private _rootStorage: Storage|null = null;
	private _shortStreamSecIds: number[]|null = null;

	constructor(filename: string) {
		super();
		this._filename = filename;
		this._skipBytes = 0;
		this._header = new Header();
		this._SAT = new AllocationTable(this);
		this._SSAT = new AllocationTable(this);
		this._directoryTree = new DirectoryTree(this);
	}

	public read() {
		this._read();
	}
	public readWithCustomHeader(size: number, callback: (buffer: Buffer) => boolean) {
		this._skipBytes = size;
		this._customHeaderCallback = callback;
		this._read();
	}
 
	private async _read() {
		const series = [
			this._openFile.bind(this),
			this._readHeader.bind(this),
			this._readMSAT.bind(this),
			this._readSAT.bind(this),
			this._readSSAT.bind(this),
			this._readDirectoryTree.bind(this)
		];
	 
		if ( this._skipBytes !== 0 ) {
			series.splice(1, 0, this._readCustomHeader.bind(this));
		}
 
		try {
			for(let i = 0, ii = series.length; i < ii; i++) {
				const chk = await series[i]();
				if(!chk) return;
			}
		} catch(err) {
			this.emit('err', err);
			return;
		}
		this.emit('ready');
	}
 
	private async _openFile() {
		this._fd = fs.openSync(this._filename, 'r', 0o666);
		return true;
	}
 
	private async _readCustomHeader() {
		return new Promise<boolean>((resolve, reject) => {
			const buffer = new Buffer(this._skipBytes);

			fs.read(this._fd, buffer, 0, this._skipBytes, 0, (err, bytesRead, buff) => {
				if(err) {
					reject(err);
					return;
				}
				if(this._customHeaderCallback && !this._customHeaderCallback(buff)) {
					resolve(false);
					return;
				}
				resolve(true);
			});
		});
	}
 
	private async _readHeader() {
		const buffer = new Buffer(512);
		const bytesRead = fs.readSync(this._fd, buffer, 0, 512, this._skipBytes);
		if ( !this._header.load( buffer ) ) {
			throw 'Not a valid compound document.';
		}
		return true;
	}
 
	private async _readMSAT() {
		const header = this._header!;
		this._MSAT = header.partialMSAT.slice(0);
		this._MSAT.length = header.SATSize;
		if( header.SATSize <= 109 || header.MSATSize === 0 ) {
			return true;
		}
 
		const buffer = new Buffer( header.secSize );
		let currMSATIndex = 109;
		let i = 0;
		let secId = header.MSATSecId;
		while(true) {
			if(i >= header.MSATSize) {
				return true;
			} else {
				const sectorBuffer = await this._readSector(secId);
				for(let s = 0; s < header.secSize - 4; s += 4) {
					if(currMSATIndex >= header.SATSize) break;
					else this._MSAT[currMSATIndex] = sectorBuffer.readInt32LE(s);
				}
				secId = sectorBuffer.readInt32LE(header.secSize - 4); 
				i++;
			}
		}
	}
 
	public async _readSector(secId: number) {
		return await this._readSectors([secId]);
	}

	public async _readSectors(secIds: number[]) {
		const header = this._header!;
		const buffer = new Buffer( secIds.length * header.secSize );
		let i = 0;

		while(true) {
			if(i >= secIds.length) {
				return buffer;
			} else {
					const bufferOffset = i * header.secSize,
							fileOffset = this._getFileOffsetForSec(secIds[i]);
					const bytesRead = fs.readSync(this._fd, buffer, bufferOffset, header.secSize, fileOffset);
					i++;
			}
		}
	}
 
 	public async _readShortSector(secId: number) {
		return await this._readShortSectors([secId]);
 	}
 
	private async _readShortSectors(secIds: number[]) {
		const header = this._header!;
		const buffer = new Buffer(secIds.length * header.shortSecSize);
		let i = 0;
 
		while(true) {
			if(i >= secIds.length) {
				return buffer;
			} else {
				const bufferOffset = i * header.shortSecSize,
							fileOffset = this._getFileOffsetForShortSec(secIds[i]);

				const bytesRead = fs.readSync(this._fd, buffer, bufferOffset, header.shortSecSize, fileOffset);
				i++;
			}
		}
	}

	private async _readSAT() {
		await this._SAT.load(this._MSAT);
		return true;
	}
	
	private async _readSSAT() {
		const header = this._header!;
		const SSAT = this._SSAT = new AllocationTable(this);
 
		const secIds = SSAT.getSecIdChain( header.SSATSecId );
		if ( secIds.length !== header.SSATSize ) {
			throw 'Invalid Short Sector Allocation Table';
		}
 
		await SSAT.load(secIds);
		return true;
	}
 
	private async _readDirectoryTree() {
		const header = this._header!;
		const secIds = this._SAT!.getSecIdChain(header.dirSecId);

		await this._directoryTree.load(secIds);
		
		const rootEntry = this._directoryTree.root;
		this._rootStorage = new Storage(this, rootEntry);
		this._shortStreamSecIds = this._SAT!.getSecIdChain( rootEntry.secId );
		return true;
	}
 
	private _getFileOffsetForSec(secId: number) {
		const secSize = this._header!.secSize;
		return this._skipBytes + (secId + 1) * secSize;  // Skip past the header sector
 	}
	private _getFileOffsetForShortSec(shortSecId: number) {
		const shortSecSize = this._header!.shortSecSize;
		const shortStreamOffset = shortSecId * shortSecSize;
		const secSize = this._header!.secSize;
		const secIdIndex = Math.floor(shortStreamOffset / secSize);
		const secOffset = shortStreamOffset % secSize;
		const secId = this._shortStreamSecIds![secIdIndex];
 
		return this._getFileOffsetForSec(secId) + secOffset;
	}
 
	public storage(storageName: string) {
		return this._rootStorage!.storage(storageName);
	}

	public stream(streamName: string) {
		return this._rootStorage!.stream(streamName);
 	}
}



exports.OleCompoundDoc = OleCompoundDoc;
