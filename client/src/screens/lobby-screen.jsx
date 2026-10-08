import { useNavigate } from "react-router-dom";
import { useState, useCallback, useEffect } from "react";
import { useSocket } from "@/contexts/socket-provider";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel, FieldLegend } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export default function LobbyScreen() {
  const socket = useSocket();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    room: ''
  });

  const handleSubmitForm = useCallback((e) => {
    e.preventDefault();
    socket.emit("room:join", formData);
  }, [formData, socket]);

  const handleJoinRoom = useCallback((data) => {
    if (data?.room) {
      navigate(`/room/${data.room}`);
    }
  }, [navigate]);

  useEffect(() => {
    socket?.on("room:join", handleJoinRoom);
    return () => {
      socket?.off("room:join", handleJoinRoom);
    };
  }, [socket, handleJoinRoom]);

  return (
    <form onSubmit={handleSubmitForm} className="w-full flex items-center justify-center min-h-screen" >
      <FieldGroup className={'max-w-sm mx-auto rounded-xl border border-border p-6'}>
        <FieldLegend className={'font-bold text-2xl!'}>Lobby</FieldLegend>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="room">Room</FieldLabel>
          <Input
            id="room"
            value={formData.room}
            onChange={(e) => setFormData({ ...formData, room: e.target.value })}
            placeholder='e.g. ABC-DEF-MNO-XYZ'
          />
        </Field>
        <Field>
          <Button type="submit" className="hover:bg-primary/80 cursor-pointer">Sign in</Button>
        </Field>
      </FieldGroup>
    </form>
  );
};
