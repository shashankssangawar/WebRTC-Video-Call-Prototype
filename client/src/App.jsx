import { Routes, Route } from "react-router-dom"
import LobbyScreen from "./screens/lobby-screen"
import RoomScreen from "./screens/room-screen"

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<LobbyScreen />} />
        <Route path="/room/:roomId" element={<RoomScreen />} />
      </Routes>
    </>
  )
}
