import "./tailwind.css";
import { QueryClientProvider } from "@tanstack/react-query";
import store from "./client-state/store";
import { Provider } from "react-redux";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { AuthProvider } from "./components/AuthProvider";
import { queryClient } from "./server-state/queryClient";
import initializeStreamListener from "./server-state/stream";

initializeStreamListener();

function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </QueryClientProvider>
    </Provider>
  );
}

export default App;
