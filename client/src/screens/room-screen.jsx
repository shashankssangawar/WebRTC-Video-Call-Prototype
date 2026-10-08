"use client";

import { useSocket } from "@/contexts/socket-provider";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowUpRightIcon, CircleUser, Phone, PhoneCall, PhoneIncoming, PhoneOff } from "lucide-react";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import UserCard from "@/components/blocks/user-card";
import peer from "@/services/peer";

export default function RoomScreen() {
  const socket = useSocket();

  // --------------------------------------------------
  // USER / ROOM
  // --------------------------------------------------
  const [roomId, setRoomId] = useState("");
  const [joinedUserSocketId, setJoinedUserSocketId] = useState("");
  const [joinedUserInfo, setJoinedUserInfo] = useState({ initials: "", username: "", email: "" });

  // --------------------------------------------------
  // CALL STATE
  // --------------------------------------------------
  const [callConnected, setCallConnected] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);

  // --------------------------------------------------
  // STREAMS
  // --------------------------------------------------
  const [myStream, setMyStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  // --------------------------------------------------
  // MY INFO
  // --------------------------------------------------
  const myInfo = useMemo(() => {
    if (typeof window === "undefined") {
      return {
        initials: "U",
        email: "",
        username: "",
      };
    }

    const username = localStorage.getItem("username") || "";
    const room_id = localStorage.getItem("room-id") || "";
    const email = localStorage.getItem("email") || "";
    const initials = username.toUpperCase().split(" ").join("") || "U";
    return { initials, email, username, room_id };
  }, []);

  // --------------------------------------------------
  // SET ROOM ID
  // --------------------------------------------------
  useEffect(() => {
    if (myInfo.room_id) {
      setRoomId(myInfo.room_id);
    }
  }, [myInfo.room_id]);

  // ==================================================
  // USER JOINED
  // ==================================================
  const handleUserJoined = useCallback(({ email, username, room, id }) => {
    console.log(`User joined room: ${username} (${id})`);
    const initials = String(username || "").toUpperCase().split(" ").join("") || "U";
    setJoinedUserSocketId(id);
    setRoomId(room);
    setJoinedUserInfo({ email, username, initials });
  }, []);

  // ==================================================
  // OUTGOING CALL
  // ==================================================
  const handleCallUser = useCallback(async () => {
    if (!joinedUserSocketId) {
      console.warn("No user available to call");
      return;
    }

    try {
      console.log("Calling:", joinedUserSocketId);
      // ----------------------------------------------
      // Get microphone
      // ----------------------------------------------
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        // video: false,
      });
      setMyStream(stream);

      // ----------------------------------------------
      // Add tracks BEFORE creating offer
      // ----------------------------------------------
      stream.getTracks().forEach((track) => {
        peer.addTrack(track, stream);
      });
      console.log("Local audio tracks added");

      // ----------------------------------------------
      // Create offer
      // ----------------------------------------------
      const offer = await peer.getOffer();
      console.log("Created offer");

      // ----------------------------------------------
      // Send offer
      // ----------------------------------------------
      socket.emit("user:call", { to: joinedUserSocketId, offer });
      console.log("Offer sent to:", joinedUserSocketId);
    } catch (error) {
      console.log("Outgoing call failed:", error);
    }
  }, [joinedUserSocketId, socket]);

  // ==================================================
  // INCOMING CALL
  // ==================================================
  const handleIncomingCall = useCallback(({ from, offer }) => {
    console.log("Incoming call from:", from);
    console.log("Incoming offer:", offer);

    // ----------------------------------------------
    // DO NOT ACCEPT AUTOMATICALLY
    // ----------------------------------------------
    setIncomingCall({ from, offer });
    setJoinedUserSocketId(from);
  }, []);

  // ==================================================
  // ACCEPT CALL
  // ==================================================
  const handleAcceptCall = useCallback(async () => {
    if (!incomingCall) {
      console.warn("No incoming call available");
      return;
    }

    try {
      const { from, offer } = incomingCall;
      console.log("Accepting call from:", from);
      // ----------------------------------------------
      // Get microphone
      // ----------------------------------------------
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        // video: false,
      });
      setMyStream(stream);

      // ----------------------------------------------
      // Add tracks BEFORE creating answer
      // ----------------------------------------------
      stream.getTracks().forEach((track) => {
        peer.addTrack(track, stream);
      });
      console.log("Receiver audio tracks added");

      // ----------------------------------------------
      // Create answer
      // ----------------------------------------------
      const answer = await peer.getAnswer(offer);
      console.log("Created answer");

      // ----------------------------------------------
      // Send answer back to caller
      // ----------------------------------------------
      socket.emit("call:accepted", { to: from, ans: answer });
      console.log("Answer sent to:", from);
      setIncomingCall(null);
      setCallConnected(true);
    } catch (error) {
      console.log("Failed to accept call:", error);
    }
  }, [incomingCall, socket]);

  // ==================================================
  // DECLINE CALL
  // ==================================================
  const handleDeclineCall = useCallback(() => {
    console.log("Declining incoming call");
    setIncomingCall(null);
  }, []);

  // ==================================================
  // CALL ACCEPTED
  // ==================================================
  const handleCallAccepted = useCallback(async ({ from, ans }) => {
    try {
      console.log("Call accepted by:", from);

      // --------------------------------------------
      // The answer is REMOTE for the caller
      // --------------------------------------------
      await peer.setRemoteDescription(ans);
      console.log("Remote answer applied");
      setCallConnected(true);
    } catch (error) {
      console.log(
        "Failed to apply answer:",
        error
      );
    }
  }, []);

  // ==================================================
  // ICE CANDIDATE
  // ==================================================
  const handleIceCandidate = useCallback(({ from, candidate }) => {
    console.log("Received ICE candidate from:", from);
    if (!candidate) {
      return;
    }

    peer.addIceCandidate(candidate).catch(
      (error) => {
        console.log("Failed to add ICE candidate:", error);
      }
    );
  }, []);

  // ==================================================
  // NEGOTIATION NEEDED
  // ==================================================
  const handleNegoNeeded = useCallback(async () => {
    try {
      if (!joinedUserSocketId) {
        return;
      }

      console.log("Negotiation needed");
      const offer = await peer.getOffer();
      socket.emit("peer:nego:needed", { offer, to: joinedUserSocketId, });
    } catch (error) {
      console.log("Negotiation error:", error);
    }
  }, [joinedUserSocketId, socket]);

  // ==================================================
  // NEGOTIATION INCOMING
  // ==================================================
  const handleNegoNeedIncoming = useCallback(async ({ from, offer }) => {
    try {
      console.log("Negotiation offer received from:", from);
      const answer = await peer.getAnswer(offer);
      socket.emit("peer:nego:done", { to: from, ans: answer, });
    } catch (error) {
      console.log("Negotiation incoming error:", error);
    }
  }, [socket]);

  // ==================================================
  // NEGOTIATION FINAL
  // ==================================================
  const handleNegoNeedFinal = useCallback(async ({ ans }) => {
    try {
      console.log("Final negotiation answer received");
      await peer.setRemoteDescription(ans);
    } catch (error) {
      console.log("Final negotiation error:", error);
    }
  }, []);

  // ==================================================
  // PEER CONNECTION EVENTS
  // ==================================================
  useEffect(() => {
    const handleTrack = (event) => {
      console.log("GOT REMOTE TRACK!");
      const [stream] = event.streams;
      if (stream) {
        setRemoteStream(stream);
      }
    };

    const handleConnectionStateChange = () => {
      console.log("Connection state:", peer.peer.connectionState);
      if (peer.peer.connectionState === "connected") {
        setCallConnected(true);
      }

      if (
        peer.peer.connectionState === "disconnected" ||
        peer.peer.connectionState === "failed" ||
        peer.peer.connectionState === "closed"
      ) {
        setCallConnected(false);
      }
    };

    const handleIceConnectionStateChange = () => {
      console.log("ICE connection state:", peer.peer.iceConnectionState);
    };

    peer.peer.addEventListener("track", handleTrack);
    peer.peer.addEventListener("connectionstatechange", handleConnectionStateChange);
    peer.peer.addEventListener("iceconnectionstatechange", handleIceConnectionStateChange);

    return () => {
      peer.peer.removeEventListener("track", handleTrack);
      peer.peer.removeEventListener("connectionstatechange", handleConnectionStateChange);
      peer.peer.removeEventListener("iceconnectionstatechange", handleIceConnectionStateChange);
    };
  }, []);

  // ==================================================
  // NEGOTIATION EVENT
  // ==================================================
  useEffect(() => {
    peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
    return () => {
      peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
    };
  }, [handleNegoNeeded]);

  // ==================================================
  // ICE CANDIDATE EVENT
  // ==================================================
  useEffect(() => {
    const handleLocalIceCandidate = (event) => {
      if (!event.candidate) {
        return;
      }

      if (!joinedUserSocketId) {
        return;
      }
      console.log("Sending ICE candidate to:", joinedUserSocketId);
      socket.emit("peer:ice-candidate", { to: joinedUserSocketId, candidate: event.candidate, });
    };

    peer.peer.addEventListener("icecandidate", handleLocalIceCandidate);
    return () => {
      peer.peer.removeEventListener("icecandidate", handleLocalIceCandidate);
    };
  }, [joinedUserSocketId, socket]);

  // ==================================================
  // SOCKET EVENTS
  // ==================================================
  useEffect(() => {
    if (!socket) {
      return;
    }

    socket.on("user:joined", handleUserJoined);
    socket.on("incoming:call", handleIncomingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("peer:ice-candidate", handleIceCandidate);
    socket.on("peer:nego:needed", handleNegoNeedIncoming);
    socket.on("peer:nego:final", handleNegoNeedFinal);
    return () => {
      socket.off("user:joined", handleUserJoined);
      socket.off("incoming:call", handleIncomingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("peer:ice-candidate", handleIceCandidate);
      socket.off("peer:nego:needed", handleNegoNeedIncoming);
      socket.off("peer:nego:final", handleNegoNeedFinal);
    };
  }, [
    socket,
    handleUserJoined,
    handleIncomingCall,
    handleCallAccepted,
    handleIceCandidate,
    handleNegoNeedIncoming,
    handleNegoNeedFinal,
  ]);

  // ==================================================
  // CLEANUP ON UNMOUNT
  // ==================================================
  useEffect(() => {
    return () => {
      if (myStream) {
        myStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [myStream]);

  // ==================================================
  // UI
  // ==================================================

  return (
    <main className="min-h-screen">
      <div className="w-full">
        <section className="md:h-[90dvh] h-[90%] p-6">

          {/* ==========================================
              INCOMING CALL / WAITING STATE
          ========================================== */}
          {!callConnected && (
            <div className="flex items-center justify-center w-full h-full">
              {incomingCall ? (
                <Card className="w-full max-w-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <PhoneIncoming className="size-5 text-primary" />
                      Incoming Call
                    </CardTitle>
                  </CardHeader>
                  <Separator />
                  <CardContent className="py-8 flex flex-col items-center justify-center">
                    <Avatar className="size-24">
                      <AvatarImage
                        src="https://github.com/shadcn.png"
                      />
                      <AvatarFallback className="text-2xl">
                        {joinedUserInfo?.initials}
                      </AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-lg font-bold mt-4">
                      {joinedUserInfo?.username}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {joinedUserInfo?.email}
                    </p>
                    <div className="flex items-center gap-2 mt-4">
                      <Badge variant="secondary">
                        Incoming call
                      </Badge>
                    </div>
                  </CardContent>
                  <Separator />
                  <CardFooter className="w-full gap-2">
                    <Button className="flex-1" onClick={handleAcceptCall} >
                      Accept
                      <PhoneIncoming />
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={handleDeclineCall} >
                      Decline
                      <PhoneOff />
                    </Button>
                  </CardFooter>
                </Card>
              ) : joinedUserSocketId ? (
                <Card className="w-full max-w-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <PhoneCall className="size-5" />
                      Ready to Call
                    </CardTitle>
                  </CardHeader>
                  <Separator />
                  <CardContent className="py-8 flex flex-col items-center">
                    <Avatar className="size-24">
                      <AvatarImage
                        src="https://github.com/shadcn.png"
                      />
                      <AvatarFallback className="text-2xl">
                        {joinedUserInfo?.initials}
                      </AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-lg font-bold mt-4">
                      {joinedUserInfo?.username}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {joinedUserInfo?.email}
                    </p>
                  </CardContent>
                  <Separator />
                  <CardFooter>
                    <Button className="w-full" onClick={handleCallUser} >
                      <Phone />
                      Call
                    </Button>
                  </CardFooter>
                </Card>
              ) : (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <CircleUser />
                    </EmptyMedia>
                    <EmptyTitle>
                      No Users Yet
                    </EmptyTitle>
                    <EmptyDescription>
                      No collaborative user found
                      yet. Please wait until someone
                      joins the room.
                    </EmptyDescription>
                  </EmptyHeader>
                  <Button
                    variant="link"
                    className="text-muted-foreground"
                    size="sm"
                    nativeButton={false}
                    render={
                      <a href="/">
                        Back to Lobby
                        <ArrowUpRightIcon />
                      </a>
                    }
                  />
                </Empty>
              )}
            </div>
          )}

          {/* ==========================================
              CALL VIEW
          ========================================== */}

          {callConnected && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myStream && (
                <UserCard
                  email={myInfo.email}
                  username={myInfo.username}
                  stream={myStream}
                />
              )}

              {remoteStream && (
                <UserCard
                  email={joinedUserInfo.email}
                  username={joinedUserInfo.username}
                  stream={remoteStream}
                />
              )}
            </div>
          )}
        </section>
        <Separator />
        <footer className="w-full flex items-center gap-4 p-6">
          <Badge
            variant="outline"
            className="font-medium"
          >
            {roomId}
          </Badge>
        </footer>
      </div>
    </main>
  );
}
