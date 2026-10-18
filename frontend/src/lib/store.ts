import { configureStore } from "@reduxjs/toolkit";
import NewRecipeDataSlice from "./Slices/NewRecipeData";
import NewRecipeReducer from "./Slices/NewRecipeSlice";
import popupSlice from "./Slices/PopupSlice";
import ProfilePopupReducer from "./Slices/ProfileMenuPopup";
import settingsReducer from "./Slices/SettingsSlice";
import searchTabReducer from "./Slices/searchTabSlice";
import tabReducer from "./Slices/tabSlice";

const store = configureStore({
	reducer: {
		tab: tabReducer,
		searchTab: searchTabReducer,
		newRecipePopup: NewRecipeReducer,
		profilePopup: ProfilePopupReducer,
		NewRecipeData: NewRecipeDataSlice,
		Popup: popupSlice,
		settings: settingsReducer,
	},
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
