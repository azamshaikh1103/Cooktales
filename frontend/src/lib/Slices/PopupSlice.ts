import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type TabOptions =
	| "signup"
	| "login"
	| "newRecipe"
	| "profileOptions"
	| "search"
	| "none";

interface TabState {
	currentPopup: TabOptions;
}

const initialState: TabState = {
	currentPopup: "none",
};

const popupSlice = createSlice({
	name: "Popup",
	initialState,
	reducers: {
		setPopup: (state, action: PayloadAction<TabOptions>) => {
			state.currentPopup = action.payload;
		},
	},
});

export const { setPopup } = popupSlice.actions;
export default popupSlice.reducer;
