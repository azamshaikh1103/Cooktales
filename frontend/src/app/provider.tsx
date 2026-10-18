'use client';

import { Provider } from 'react-redux';
import store from '@/lib/store';
import { AuthProvider } from '@/lib/auth/AuthContext';
import { NotificationRealtimeProvider } from '@/lib/notifications/NotificationRealtimeProvider';

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
