import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface ProfilePopupState {
	isProfilePopupActive: boolean;
}

const initialState: ProfilePopupState = {
	isProfilePopupActive: false,
};

const ProfilePopupSlice = createSlice({
	name: "profilePopup",
	initialState,
	reducers: {
		setProfilePopup: (state, action: PayloadAction<boolean>) => {
			state.isProfilePopupActive = action.payload;
		},
	},
});

export const { setProfilePopup } = ProfilePopupSlice.actions;
export default ProfilePopupSlice.reducer;
