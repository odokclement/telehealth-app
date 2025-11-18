import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";
import HomeIndex from "./pages/Home/HeroIndex";
import Hero from "./pages/Home/Hero";

//Authentication Section

import Signup from "./pages/Auth/signup/signup";
import Login from "./pages/Auth/Login/Login";
import ForgotPass from "./pages/Auth/Login/ForgotPass";
import VerifyAcct from "./pages/Auth/Login/VerrifyAcc";

// Dashboard
// import Dashboard from "./pages/Dashboard/Dashboard";
import VideoStream from "./components/VideoStream";
import { StreamProvider } from "./components/StreamContext";

const StreamLayout = () => (
  <StreamProvider>
    <Outlet />
  </StreamProvider>
);

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomeIndex />,
    children: [{ index: true, element: <Hero /> }],
  },

  { path: "signup", element: <Signup /> },
  { path: "login", element: <Login /> },
  { path: "forgotPass", element: <ForgotPass /> },
  { path: "verifyAcct", element: <VerifyAcct /> },

  {
    element: <StreamLayout />,
    children: [
      // { path: "dashboard", element: <Dashboard /> },
      { path: "videoCall", element: <VideoStream /> },
    ],
  },
]);

function App() {
  return (
    <div className=" w-full min-w-[100vw] min-h-[100vh]">
      <RouterProvider router={router} />
    </div>
  );
}

export default App;
