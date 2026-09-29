import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/routes';
import { PermissionsProvider } from './features/system-security/context/PermissionsContext';

export function App() {
  return (
    <PermissionsProvider>
      <RouterProvider router={router} />
    </PermissionsProvider>
  );
}

export default App;
