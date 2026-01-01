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
    // Connect to default PeerJS server (public)
    this.peer = new Peer();
    
    this.peer.on('open', (id) => {
      this.myId = id;
      onId(id);
    });

    // Handle incoming connections (HOST logic)
    this.peer.on('connection', (conn) => {
      this.setupConnection(conn);
    });
  }

  // Connect to another peer (CLIENT logic)
  connectToPeer(peerId: string) {
    if (!this.peer) return;
    const conn = this.peer.connect(peerId);
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
