import React, { useEffect, useState, useRef } from "react";
import { User } from "../types/types";
import { Button } from "./shadcn/ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "./shadcn/ui/card";
import { Input } from "./shadcn/ui/input";
import { X, Send, Loader2 } from "lucide-react";
import { format } from 'date-fns';
import { sendMessage, getChatMessages } from "../services/MindsMeshAPI";
import { io, Socket } from "socket.io-client";
import { v4 as uuidv4 } from 'uuid'; 

const formatTime = (date: Date) => {
  return format(new Date(date), 'HH:mm');
};

const Chat: React.FC<{ freelancer: User; onClose?: () => void }> = ({
  freelancer,
  onClose,
}) => {
  const [messages, setMessages] = useState<
    Array<{
      id: string;
      senderId: string;
      text: string;
      timestamp: Date;
      status?: "sending" | "sent" | "error";
    }>
  >([]);
  const [newMessage, setNewMessage] = useState("");
  const [isConnecting, setIsConnecting] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const senderId = localStorage.getItem("userId");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const loadChatHistory = async () => {
      if (senderId && freelancer.id) {
        try {
          // Fetch existing messages between senderId and freelancer.id
          const response = await getChatMessages(senderId, freelancer.id);

          // Update the messages state with the history
          setMessages(response.map((msg) => ({
            id: msg.id,
            senderId: msg.sender.id,
            text: msg.message,
            timestamp: new Date(msg.createdAt),
            status: "sent",
          })));
        } catch (error) {
          console.error("Error loading chat history:", error);
        }
      }
    };

    loadChatHistory();
  }, [senderId, freelancer.id]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && senderId) {
      const newSocket = io("http://localhost:3000", {
        auth: { token },
      });

      setSocket(newSocket);

      newSocket.on("connect", () => {
        setIsConnecting(false);
        console.log("Connected to socket");
      });

      // Listen for the receiveMessage event
      newSocket.on("receiveMessage", (message) => {
        console.log("Received message:", message);  // Verify message content

        // Check if the message already exists to prevent duplication
        setMessages((prev) => {
          if (prev.some((msg) => msg.id === message.id)) {
            return prev; // Message already exists, do nothing
          }
          return [
            ...prev,
            {
              id: message.id,
              senderId: message.sender.id,
              text: message.message,
              timestamp: new Date(message.createdAt),
              status: "sent",
            },
          ];
        });
      });

      newSocket.on("connect_error", (err) => {
        setIsConnecting(false);
        console.error("Socket connection error:", err);
      });

      return () => {
        newSocket.disconnect();
      };
    }
  }, [senderId]);

  const handleSendMessage = async () => {
    if (!senderId || !newMessage.trim()) return;

    // Generate a UUID to identify the message uniquely
    const tempId = uuidv4();

    const messageObj = {
      id: tempId, // UUID for unique ID
      senderId,
      receiverId: freelancer.id,
      text: newMessage.trim(),
      timestamp: new Date(),
      status: "sending" as const,
    };

    // Add the message immediately to the state to reflect UI changes
    setMessages((prev) => [...prev, messageObj]);
    setNewMessage("");

    try {
      // Send the message via API
      const savedMessage = await sendMessage(freelancer.id, messageObj.text);

      // Emit the message via socket after it has been successfully saved
      if (socket) {
        socket.emit("sendMessage", {
          id: savedMessage.id,
          senderId: savedMessage.sender.id,
          receiverId: savedMessage.receiver.id,
          text: savedMessage.message,
          createdAt: savedMessage.createdAt,
        });
      }

      // Update message status to 'sent'
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageObj.id ? { ...msg, status: "sent" as const, id: savedMessage.id } : msg
        )
      );
    } catch (error) {
      console.error("Error sending message:", error);
      // Update message status to 'error'
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageObj.id ? { ...msg, status: "error" as const } : msg
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
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold">
                {freelancer.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ${
                isConnecting ? "bg-yellow-400" : "bg-green-400"
              }`}
            />
          </div>
          <div>
            <h3 className="font-semibold">{freelancer.username}</h3>
            <p className="text-sm text-gray-500">
              {isConnecting ? "Connecting..." : "Online"}
            </p>
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
      </CardHeader>

      <CardContent className="p-4">
        <div className="h-96 overflow-y-auto space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.senderId === senderId ? "justify-end" : "justify-start"}`}
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
                    msg.senderId === senderId ? "justify-end" : "justify-start"
                  }`}
                >
                  <span className="text-gray-500">
                    {formatTime(msg.timestamp)}
                  </span>
                  {msg.senderId === senderId && (
                    <span>
                      {msg.status === "sending" && (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      )}
                      {msg.status === "error" && (
                        <span className="text-red-500">!</span>
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </CardContent>

      <CardFooter className="p-4 border-t">
        <div className="flex w-full items-center space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            size="icon"
            className="rounded-full"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default Chat;


