import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type TabType = "signup" | "login" | "none";

interface TabState {
	currentTab: TabType;
}

const initialState: TabState = {
	currentTab: "none",
};

const tabSlice = createSlice({
	name: "tab",
	initialState,
	reducers: {
		setTab: (state, action: PayloadAction<TabType>) => {
			state.currentTab = action.payload;
		},
	},
});

export const { setTab } = tabSlice.actions;
export default tabSlice.reducer;
