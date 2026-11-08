"use client";

import { Provider } from "react-redux";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { NotificationRealtimeProvider } from "@/lib/notifications/NotificationRealtimeProvider";
import store from "@/lib/store";

const ReduxContextProvider = ({ children }: { children: React.ReactNode }) => {
	return (
		<Provider store={store}>
			<AuthProvider>
				<NotificationRealtimeProvider>{children}</NotificationRealtimeProvider>
			</AuthProvider>
		</Provider>
	);
};

export default ReduxContextProvider;
