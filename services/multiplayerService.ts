import Peer, { DataConnection } from 'peerjs';
import { NetworkMessage } from '../types';

type MessageCallback = (msg: NetworkMessage) => void;

class MultiplayerService {
  private peer: Peer | null = null;
  private conn: DataConnection | null = null;
  private onMessageCallback: MessageCallback | null = null;
  private onConnectCallback: (() => void) | null = null;

  public myId: string = '';

  initialize(onId: (id: string) => void) {
    // Helper to create a peer with a short, random ID
    const createPeer = () => {
        // Generate a short ID: "MW-" + 4 random uppercase alphanumeric characters
        // Example: MW-X92Z
        const shortId = 'MW-' + Math.random().toString(36).substring(2, 6).toUpperCase();
        
        const peer = new Peer(shortId);
        
        peer.on('open', (id) => {
            this.peer = peer;
            this.myId = id;
            onId(id);
        });

        // Handle incoming connections (HOST logic)
        peer.on('connection', (conn) => {
            this.setupConnection(conn);
        });

        peer.on('error', (err: any) => {
            console.warn("Peer initialization error:", err.type, err);
            if (err.type === 'unavailable-id') {
                // ID collision, try again with a new random ID
                peer.destroy();
                createPeer();
            }
        });
    };

    createPeer();
  }

  // Connect to another peer (CLIENT logic)
  connectToPeer(peerId: string) {
    // If we haven't initialized our own peer yet (Client side might need one to connect)
    if (!this.peer) {
         // Create a temporary peer for the client to connect from
         this.peer = new Peer();
         this.peer.on('open', () => {
             this.doConnect(peerId);
         });
         this.peer.on('error', (err) => console.error("Client Peer Error", err));
    } else {
        this.doConnect(peerId);
    }
  }

  private doConnect(peerId: string) {
      if (!this.peer) return;
      // Ensure peerId is uppercase/trimmed as users might type loosely
      const cleanId = peerId.trim().toUpperCase();
      const conn = this.peer.connect(cleanId);
      this.setupConnection(conn);
  }

  private setupConnection(conn: DataConnection) {
    this.conn = conn;

    this.conn.on('open', () => {
      console.log('Connection established');
      if (this.onConnectCallback) this.onConnectCallback();
    });

    this.conn.on('data', (data) => {
      if (this.onMessageCallback) {
        this.onMessageCallback(data as NetworkMessage);
      }
    });

    this.conn.on('close', () => {
      console.log('Connection closed');
      // Handle disconnection?
    });
    
    this.conn.on('error', (err) => {
        console.error("Connection error", err);
    });
  }

  send(msg: NetworkMessage) {
    if (this.conn && this.conn.open) {
      this.conn.send(msg);
    }
  }

  onMessage(cb: MessageCallback) {
    this.onMessageCallback = cb;
  }

  onConnect(cb: () => void) {
    this.onConnectCallback = cb;
  }
  
  destroy() {
      if (this.conn) this.conn.close();
      if (this.peer) this.peer.destroy();
  }
}

export const mpService = new MultiplayerService();