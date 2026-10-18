import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type SettingsTab = "profile" | "account" | "privacy" | "security" | "logout";

interface SettingsState {
	isSettingsPopupActive: boolean;
	activeTab: SettingsTab;
}

const initialState: SettingsState = {
	isSettingsPopupActive: false,
	activeTab: "profile",
};

const settingsSlice = createSlice({
	name: "Settings",
	initialState,
	reducers: {
		setSettingsPopup: (state, action: PayloadAction<boolean>) => {
			state.isSettingsPopupActive = action.payload;
			if (!action.payload) {
				state.activeTab = "profile";
			}
		},
		setSettingsTab: (state, action: PayloadAction<SettingsTab>) => {
			state.activeTab = action.payload;
		},
	},
});

export const { setSettingsPopup, setSettingsTab } = settingsSlice.actions;
export default settingsSlice.reducer;
