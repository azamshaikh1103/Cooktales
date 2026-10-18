import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface SearchTabState {
	isSearchTabActive: boolean;
}

const initialState: SearchTabState = {
	isSearchTabActive: false,
};

const searchTabSlice = createSlice({
	name: "searchTab",
	initialState,
	reducers: {
		setSearchTab: (state, action: PayloadAction<boolean>) => {
			state.isSearchTabActive = action.payload;
		},
	},
});

export const { setSearchTab } = searchTabSlice.actions;
export default searchTabSlice.reducer;
