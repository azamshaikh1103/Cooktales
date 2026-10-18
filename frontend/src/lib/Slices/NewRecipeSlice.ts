import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface NewRecipeState {
	isNewRecipePopupActive: boolean;
}

const initialState: NewRecipeState = {
	isNewRecipePopupActive: false,
};

const NewRecipeSlice = createSlice({
	name: "newRecipePopup",
	initialState,
	reducers: {
		setNewRecipePopup: (state, action: PayloadAction<boolean>) => {
			state.isNewRecipePopupActive = action.payload;
		},
	},
});

export const { setNewRecipePopup } = NewRecipeSlice.actions;
export default NewRecipeSlice.reducer;
