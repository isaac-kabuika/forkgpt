import { createBrowserRouter } from "react-router-dom";
import { Layout } from "./components/Layout";
import { TopicView } from "./components/TopicView";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <TopicView />,
      },
    ],
  },
]);
