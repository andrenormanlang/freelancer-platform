import React, { useEffect, useState, useRef } from "react";
import { User } from "../types/types";
import { Button } from "./shadcn/ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "./shadcn/ui/card";
import { Input } from "./shadcn/ui/input";
import { X, Send, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { getChatMessages, createRoom } from "../services/MindsMeshAPI";
import { io, Socket } from "socket.io-client";
import { v4 as uuidv4 } from "uuid";

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: Date;
  status?: "sending" | "sent" | "error";
}

const formatTime = (date: Date) => {
  return format(new Date(date), "HH:mm");
};

const Chat: React.FC<{ chatPartner?: User | null; onClose?: () => void }> = ({
  chatPartner,
  onClose,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isConnecting, setIsConnecting] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const senderId = localStorage.getItem("userId");

  useEffect(() => {
    if (senderId && chatPartner) {
      const initializeChat = async () => {
        try {
          const currentUserRole = localStorage.getItem("userRole");
          if (currentUserRole === "employer") {
            // Only employers can create rooms
            await createRoom(chatPartner.id, `${senderId}-${chatPartner.id}`);
          }
          loadChatHistory();
        } catch (error) {
          console.error("Error initializing chat:", error);
        }
      };

      initializeChat();
    }
  }, [chatPartner, senderId]);

  const loadChatHistory = async () => {
    if (senderId && chatPartner?.id) {
      try {
        const response = await getChatMessages(senderId, chatPartner.id);
        setMessages(
          response.map((msg: any) => ({
            id: msg.id,
            senderId: msg.sender.id,
            receiverId: msg.receiver.id,
            text: msg.message,
            timestamp: new Date(msg.createdAt),
            status: "sent",
          }))
        );
      } catch (error) {
        console.error("Error loading chat history:", error);
      }
    } else {
      setMessages([]); // Clear messages if no chat partner is selected
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token && senderId && chatPartner) {
      const newSocket = io("http://localhost:3000", {
        auth: { token },
      });

      setSocket(newSocket);

      newSocket.on("connect", () => {
        setIsConnecting(false);
        console.log("Connected to socket");
      });

      newSocket.on("disconnect", () => {
        setIsConnecting(true);
        console.log("Socket disconnected.");
      });

      newSocket.on("reconnect_attempt", () => {
        setIsConnecting(true);
        console.log("Attempting to reconnect...");
      });

      newSocket.on("receiveMessage", (message: Message) => {
        if (
          (message.senderId === chatPartner?.id && message.receiverId === senderId) ||
          (message.senderId === senderId && message.receiverId === chatPartner?.id)
        ) {
          setMessages((prev) => {
            const existingMessageIndex = prev.findIndex((msg) => msg.id === message.id);
            if (existingMessageIndex !== -1) {
              // Update the existing message
              const updatedMessages = [...prev];
              updatedMessages[existingMessageIndex] = {
                ...message,
                timestamp: new Date(message.timestamp),
                status: "sent",
              };
              return updatedMessages;
            } else {
              // Add new message
              return [
                ...prev,
                {
                  ...message,
                  timestamp: new Date(message.timestamp),
                  status: "sent",
                },
              ];
            }
          });
        }
      });

      return () => {
        newSocket.disconnect();
      };
    }
  }, [senderId, chatPartner]);

  useEffect(() => {
    if (!isConnecting) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isConnecting]);

  const handleSendMessage = async () => {
    if (!senderId || !newMessage.trim() || !chatPartner) return;

    const messageObj: Message = {
      id: uuidv4(),
      senderId,
      receiverId: chatPartner.id,
      text: newMessage.trim(),
      timestamp: new Date(),
      status: "sending",
    };

    setMessages((prev) => [...prev, messageObj]);
    setNewMessage("");

    try {
      if (socket) {
        socket.emit("sendMessage", messageObj);
      }
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageObj.id ? { ...msg, status: "sent" } : msg
        )
      );
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageObj.id ? { ...msg, status: "error" } : msg
        )
      );
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
        {chatPartner ? (
          <>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">
                    {chatPartner.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                {/* Connection status indicator */}
                <span
                  className={`absolute bottom-0 right-0 block w-3 h-3 rounded-full ${
                    isConnecting ? "bg-yellow-400" : "bg-green-500"
                  }`}
                />
              </div>
              <div>
                <h3 className="font-semibold">{chatPartner.username}</h3>
              </div>
            </div>
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="hover:bg-gray-100 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </>
        ) : (
          <div className="flex-1 text-center">
            <h3 className="font-semibold">Select a Conversation</h3>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-4">
        <div className="h-96 overflow-y-auto space-y-4">
          {isConnecting ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
              <span className="ml-2 text-gray-500">Connecting...</span>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.senderId === senderId ? "justify-end" : "justify-start"
                  }`}
                >
                  <div className="flex flex-col space-y-1 max-w-[75%]">
                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        msg.senderId === senderId
                          ? "bg-blue-600 text-white rounded-br-none"
                          : "bg-gray-100 text-gray-900 rounded-bl-none"
                      }`}
                    >
                      {msg.text}
                    </div>
                    <div
                      className={`flex items-center space-x-2 text-xs ${
                        msg.senderId === senderId
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <span className="text-gray-500">
                        {formatTime(msg.timestamp)}
                      </span>
                      {msg.senderId === senderId && msg.status === "sending" && (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </CardContent>

      {chatPartner && (
        <CardFooter className="p-4 border-t">
          <div className="flex w-full items-center space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1"
              disabled={isConnecting}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isConnecting}
              size="icon"
              className="rounded-full"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default Chat;
