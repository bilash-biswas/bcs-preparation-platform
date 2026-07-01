// store/slices/websocketSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { WebSocketMessage } from '@/types/battle';

interface WebSocketState {
  isConnected: boolean;
  messages: WebSocketMessage[];
  connectionError: string | null;
}

const initialState: WebSocketState = {
  isConnected: false,
  messages: [],
  connectionError: null,
};

const websocketSlice = createSlice({
  name: 'websocket',
  initialState,
  reducers: {
    connectionEstablished: (state) => {
      state.isConnected = true;
      state.connectionError = null;
    },
    connectionLost: (state, action: PayloadAction<string>) => {
      state.isConnected = false;
      state.connectionError = action.payload;
    },
    messageReceived: (state, action: PayloadAction<WebSocketMessage>) => {
      state.messages.push(action.payload);
    },
    clearMessages: (state) => {
      state.messages = [];
    },
    sendMessage: (state, action: PayloadAction<any>) => {
      // This will be handled by the middleware
    },
  },
});

export const {
  connectionEstablished,
  connectionLost,
  messageReceived,
  clearMessages,
  sendMessage,
} = websocketSlice.actions;

export default websocketSlice.reducer;