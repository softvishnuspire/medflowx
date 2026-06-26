import { io } from 'socket.io-client';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export const socket = io(BACKEND_URL, {
  autoConnect: false, // Page can connect manually in a useEffect
});
