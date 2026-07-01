// store/slices/battleSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Battle, CreateBattleData, BattleAnswer } from '@/types/battle';
import { battleAPI } from '@/lib/api/services';

interface BattleState {
  currentBattle: Battle | null;
  availableBattles: Battle[];
  activeBattles: Battle[];
  loading: boolean;
  error: string | null;
}

const initialState: BattleState = {
  currentBattle: null,
  availableBattles: [],
  activeBattles: [],
  loading: false,
  error: null,
};

// Async thunks
export const createBattle = createAsyncThunk(
  'battle/createBattle',
  async (battleData: CreateBattleData) => {
    const response = await battleAPI.createBattle(battleData);
    return response.data;
  }
);

export const createQuickBattle = createAsyncThunk(
  'battle/createQuickBattle',
  async () => {
    const response = await battleAPI.createQuickBattle();
    return response.data;
  }
);

export const joinBattle = createAsyncThunk(
  'battle/joinBattle',
  async (battleCode: string) => {
    const response = await battleAPI.joinBattle(battleCode);
    return response.data;
  }
);

export const getAvailableBattles = createAsyncThunk(
  'battle/getAvailableBattles',
  async () => {
    const response = await battleAPI.getAvailableBattles();
    return response.data;
  }
);

export const getActiveBattles = createAsyncThunk(
  'battle/getActiveBattles',
  async () => {
    const response = await battleAPI.getActiveBattles();
    return response.data;
  }
);

export const markReady = createAsyncThunk(
  'battle/markReady',
  async (battleId: number) => {
    const response = await battleAPI.markReady(battleId);
    return response.data;
  }
);

export const submitAnswer = createAsyncThunk(
  'battle/submitAnswer',
  async ({ battleId, answer }: { battleId: number; answer: BattleAnswer }) => {
    const response = await battleAPI.submitAnswer(battleId, answer);
    return response.data;
  }
);

const battleSlice = createSlice({
  name: 'battle',
  initialState,
  reducers: {
    setCurrentBattle: (state, action: PayloadAction<Battle | null>) => {
      state.currentBattle = action.payload;
    },
    updateBattle: (state, action: PayloadAction<Battle>) => {
      if (state.currentBattle && state.currentBattle.id === action.payload.id) {
        state.currentBattle = action.payload;
      }
      
      // Update in available battles
      state.availableBattles = state.availableBattles.map(battle =>
        battle.id === action.payload.id ? action.payload : battle
      );
      
      // Update in active battles
      state.activeBattles = state.activeBattles.map(battle =>
        battle.id === action.payload.id ? action.payload : battle
      );
    },
    clearError: (state) => {
      state.error = null;
    },
    resetBattle: (state) => {
      state.currentBattle = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Battle
      .addCase(createBattle.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createBattle.fulfilled, (state, action) => {
        state.loading = false;
        state.currentBattle = action.payload;
      })
      .addCase(createBattle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create battle';
      })
      // Create Quick Battle
      .addCase(createQuickBattle.fulfilled, (state, action) => {
        state.currentBattle = action.payload;
      })
      // Join Battle
      .addCase(joinBattle.fulfilled, (state, action) => {
        state.currentBattle = action.payload;
      })
      .addCase(joinBattle.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to join battle';
      })
      // Get Available Battles
      .addCase(getAvailableBattles.fulfilled, (state, action) => {
        state.availableBattles = action.payload;
      })
      // Get Active Battles
      .addCase(getActiveBattles.fulfilled, (state, action) => {
        state.activeBattles = action.payload;
      });
  },
});

export const { setCurrentBattle, updateBattle, clearError, resetBattle } = battleSlice.actions;
export default battleSlice.reducer;