// hooks/useBattle.ts
import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { 
  createBattle, 
  createQuickBattle, 
  joinBattle, 
  getAvailableBattles, 
  getActiveBattles,
  markReady,
  submitAnswer,
  updateBattle,
  resetBattle 
} from '@/store/slices/battleSlice';
import { battleWebSocket } from '@/services/websocket';
import { CreateBattleData, BattleAnswer, WebSocketMessage } from '@/types/battle';

export const useBattle = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { currentBattle, availableBattles, activeBattles, loading, error } = useSelector(
    (state: RootState) => state.battle
  );

  // WebSocket message handler
  useEffect(() => {
    if (!currentBattle) return;

    const handleWebSocketMessage = (message: WebSocketMessage) => {
      switch (message.type) {
        case 'battle_state':
        case 'battle_state_update':
          if (message.battle) {
            dispatch(updateBattle(message.battle));
          }
          break;
        case 'question_start':
          console.log('Question started:', message.question_index);
          break;
        case 'battle_completed':
          console.log('Battle completed:', message.results);
          break;
        case 'chat_message':
          console.log('Chat message:', message.user, message.message);
          break;
      }
    };

    battleWebSocket.onMessage(handleWebSocketMessage);

    return () => {
      battleWebSocket.removeMessageCallback(handleWebSocketMessage);
    };
  }, [currentBattle, dispatch]);

  const createNewBattle = useCallback((battleData: CreateBattleData) => {
    return dispatch(createBattle(battleData));
  }, [dispatch]);

  const createQuickMatch = useCallback(() => {
    return dispatch(createQuickBattle());
  }, [dispatch]);

  const joinBattleByCode = useCallback((battleCode: string) => {
    return dispatch(joinBattle(battleCode));
  }, [dispatch]);

  const loadAvailableBattles = useCallback(() => {
    dispatch(getAvailableBattles());
  }, [dispatch]);

  const loadActiveBattles = useCallback(() => {
    dispatch(getActiveBattles());
  }, [dispatch]);

  const setPlayerReady = useCallback((battleId: number) => {
    return dispatch(markReady(battleId));
  }, [dispatch]);

  const submitBattleAnswer = useCallback((battleId: number, answer: BattleAnswer) => {
    return dispatch(submitAnswer({ battleId, answer }));
  }, [dispatch]);

  const connectToBattle = useCallback((battleCode: string) => {
    battleWebSocket.connect(battleCode);
  }, []);

  const disconnectFromBattle = useCallback(() => {
    battleWebSocket.disconnect();
    dispatch(resetBattle());
  }, [dispatch]);

  const sendReadySignal = useCallback(() => {
    if (currentBattle) {
      battleWebSocket.sendMessage({
        type: 'player_ready'
      });
    }
  }, [currentBattle]);

  const sendChatMessage = useCallback((message: string) => {
    if (currentBattle) {
      battleWebSocket.sendMessage({
        type: 'chat_message',
        message
      });
    }
  }, [currentBattle]);

  const sendAnswer = useCallback((questionId: number, selectedOptions: number[], timeTaken: number) => {
    if (currentBattle) {
      battleWebSocket.sendMessage({
        type: 'submit_answer',
        question_id: questionId,
        selected_options: selectedOptions,
        time_taken: timeTaken
      });
    }
  }, [currentBattle]);

  return {
    // State
    currentBattle,
    availableBattles,
    activeBattles,
    loading,
    error,
    // Actions
    createNewBattle,
    createQuickMatch,
    joinBattleByCode,
    loadAvailableBattles,
    loadActiveBattles,
    setPlayerReady,
    submitBattleAnswer,
    connectToBattle,
    disconnectFromBattle,
    sendReadySignal,
    sendChatMessage,
    sendAnswer,
  };
};