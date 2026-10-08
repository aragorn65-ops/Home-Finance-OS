import AppRouter from "./app/router";
import PrivateStorageBoundary from "./features/auth/components/PrivateStorageBoundary";

export default function App() {
  return <PrivateStorageBoundary><AppRouter /></PrivateStorageBoundary>;
}
