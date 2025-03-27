// src/components/Chat.tsx

import React, { useEffect, useState, useRef, useContext } from "react";
import { User } from "../types/types";
import { Button } from "./shadcn/ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "./shadcn/ui/card";
import { Input } from "./shadcn/ui/input";
import { Send, Loader2, X, Image, FileText, File } from "lucide-react";
import { format } from "date-fns";
import { getChatMessages, createRoom } from "../services/MindsMeshAPI";
import { v4 as uuidv4 } from "uuid";
import { PaperClipIcon } from "@heroicons/react/20/solid";
import { SocketContext } from "../contexts/SocketContext"; 


interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: Date;
  status?: "sending" | "sent" | "error";
  isRead?: boolean;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
}

interface MessagesReadPayload {
  senderId: string;
  receiverId: string;
}

const formatTime = (date: Date) => {
  return format(new Date(date), "HH:mm");
};

const Chat: React.FC<{ chatPartner?: User | null; onClose?: () => void }> = ({
  chatPartner,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isConnecting, setIsConnecting] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { socket } = useContext(SocketContext); // Access socket from context
  const senderId = localStorage.getItem("userId");

  // Track window focus/blur
  const [isActive, setIsActive] = useState(document.hasFocus());

  useEffect(() => {
    const handleFocus = () => setIsActive(true);
    const handleBlur = () => setIsActive(false);

    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  useEffect(() => {
    if (senderId && chatPartner) {
      const initializeChat = async () => {
        setIsConnecting(true); // Start loading
        try {
          const currentUserRole = localStorage.getItem("userRole");
          if (currentUserRole === "employer") {
            // Only employers can create rooms
            await createRoom(chatPartner.id, `${senderId}-${chatPartner.id}`);
          }
          await loadChatHistory();
        } catch (error) {
          console.error("Error initializing chat:", error);
        } finally {
          setIsConnecting(false); // Stop loading
        }
      };
      initializeChat();
    } else {
      setIsConnecting(false); // If no chat partner, stop loading
    }
  }, [chatPartner, senderId]);

  const handleTyping = () => {
    if (socket && chatPartner) {
      socket.emit("typing", { receiverId: chatPartner.id });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stopTyping", { receiverId: chatPartner.id });
        setIsTyping(false);
      }, 1000);

      setIsTyping(true);
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const loadChatHistory = async () => {
    if (senderId && chatPartner?.id && socket) { // Ensure socket is available
      try {
        const response = await getChatMessages(senderId, chatPartner.id);
        console.log("Chat history response:", response); // Debug log
        setMessages(
          response.map((msg: any) => ({
            id: msg.id,
            senderId: msg.sender.id,
            receiverId: msg.receiver.id,
            text: msg.message,
            timestamp: new Date(msg.createdAt),
            status: "sent",
            isRead: msg.isRead,
            fileUrl: msg.fileUrl,
            fileName: msg.fileName,
            fileType: msg.fileType,
          }))
        );

        // After loading messages, emit 'markAsRead' to mark all as read
        socket.emit("markAsRead", { senderId: chatPartner.id, receiverId: senderId });
      } catch (error) {
        console.error("Error loading chat history:", error);
      }
    } else {
      setMessages([]); // Clear messages if no chat partner is selected
    }
  };

  // Emit markAsRead when chat is opened and active
  useEffect(() => {
    if (isActive && socket && senderId && chatPartner) {
      socket.emit("markAsRead", { senderId: chatPartner.id, receiverId: senderId });
    }
  }, [isActive, socket, senderId, chatPartner]);

  useEffect(() => {
    if (socket && senderId && chatPartner) {
      const handleReceiveMessage = (message: any) => {
        console.log("Received message:", message); // Debug log
        
        if (
          (message.senderId === chatPartner.id && message.receiverId === senderId) ||
          (message.senderId === senderId && message.receiverId === chatPartner.id)
        ) {
          setMessages((prev) => {
            const existingMessageIndex = prev.findIndex((msg) => msg.id === message.id);
            if (existingMessageIndex !== -1) {
              const updatedMessages = [...prev];
              updatedMessages[existingMessageIndex] = {
                ...message,
                timestamp: new Date(message.timestamp),
                status: "sent",
              };
              return updatedMessages;
            } else {
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

          // Emit 'markAsRead' if the chat is active
          if (isActive && chatPartner && message.senderId === chatPartner.id) {
            socket.emit("markAsRead", { senderId: message.senderId, receiverId: senderId });
          }
        }
      };

      const handleMessagesRead = (data: MessagesReadPayload) => {
        const { senderId: readSenderId, receiverId: readReceiverId } = data;
        if (readSenderId === senderId && readReceiverId === chatPartner.id) {
          setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg.senderId === senderId && !msg.isRead
                ? { ...msg, isRead: true }
                : msg
            )
          );
        }
      };

      socket.on("receiveMessage", handleReceiveMessage);
      socket.on("messagesRead", handleMessagesRead);

      return () => {
        socket.off("receiveMessage", handleReceiveMessage);
        socket.off("messagesRead", handleMessagesRead);
      };
    }
  }, [socket, senderId, chatPartner, isActive]);

  useEffect(() => {
    if (!isConnecting) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isConnecting]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadFile = async (file: File): Promise<{ url: string, fileName: string, fileType: string } | null> => {
    if (!chatPartner || !senderId) {
      return null;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('text', newMessage);
    formData.append('messageId', uuidv4());

    try {
      setIsUploading(true);
      const response = await fetch(`/api/chat/${chatPartner.id}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("File upload response:", data); // Debug log
      return {
        url: data.fileUrl,
        fileName: data.fileName,
        fileType: data.fileType,
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!senderId || (!newMessage.trim() && !selectedFile) || !chatPartner || !socket) return;

    const messageId = uuidv4();
    let fileInfo = null;

    // Create base message object
    const messageObj: Message = {
      id: messageId,
      senderId,
      receiverId: chatPartner.id,
      text: newMessage.trim() || (selectedFile ? `Sent a file: ${selectedFile.name}` : ''),
      timestamp: new Date(),
      status: "sending",
      isRead: false,
    };

    // Add to messages immediately for UI feedback
    setMessages((prev) => [...prev, messageObj]);
    setNewMessage("");

    // If there's a file, upload it first
    if (selectedFile) {
      fileInfo = await uploadFile(selectedFile);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      if (fileInfo) {
        // Update message with file info
        messageObj.fileUrl = fileInfo.url;
        messageObj.fileName = fileInfo.fileName;
        messageObj.fileType = fileInfo.fileType;
      }
    }

    try {
      // Send message through socket
      console.log("Sending message:", messageObj); // Debug log
      socket.emit("sendMessage", messageObj);
      
      // Update local message status
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageObj.id ? { 
            ...msg, 
            status: "sent",
            fileUrl: messageObj.fileUrl,
            fileName: messageObj.fileName,
            fileType: messageObj.fileType
          } : msg
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

  const renderMessageContent = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  const renderFilePreview = (message: Message) => {
    if (!message.fileUrl) return null;
    
    console.log("Rendering file preview:", message.fileUrl, message.fileType, message.fileName); // Debug log

    // Ensure we have the file name with extension
    const fileName = message.fileName || 'file';
    
    const isImage = message.fileType?.startsWith('image/');
    const isPdf = message.fileType === 'application/pdf';
    const isText = message.fileType?.startsWith('text/');
    
    // Helper function to get appropriate file icon
    const getFileIcon = () => {
      if (isPdf) return <FileText size={16} className="mr-2" />;
      if (isText) return <FileText size={16} className="mr-2" />;
      return <File size={16} className="mr-2" />;
    };

    return (
      <div className="mt-2 max-w-full">
        {isImage ? (
          <a 
            href={message.fileUrl} 
            target="_blank"
            rel="noopener noreferrer"
            className="block"
            download={fileName}
          >
            <img 
              src={message.fileUrl} 
              alt={fileName || 'Attached image'} 
              className="max-w-full max-h-48 rounded-lg object-contain"
            />
            <span className="text-xs mt-1 flex items-center">
              <Image size={12} className="mr-1" />
              {fileName}
            </span>
          </a>
        ) : (
          <a 
            href={message.fileUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            download={fileName}
          >
            {getFileIcon()}
            <span className="text-sm truncate">{fileName}</span>
          </a>
        )}
      </div>
    );
  };

  const renderMessageStatus = (message: Message) => {
    if (message.senderId !== senderId) return null;

    if (message.isRead) {
      return <span className="text-xs text-blue-400">READ</span>; // Read
    } else {
      return <span className="text-xs text-gray-400">UNREAD</span>; // Delivered
    }
  };

  const groupMessagesByDate = (messages: Message[]) => {
    return messages.reduce((groups: { [key: string]: Message[] }, message) => {
      const date = format(new Date(message.timestamp), "MMM dd, yyyy");
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
      return groups;
    }, {});
  };

  return (
    <Card className="w-full max-w-md bg-white shadow-lg rounded-lg overflow-hidden">
      <CardHeader className="border-b bg-white p-4">
        {chatPartner ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                {chatPartner?.avatarUrl ? (
                  <img
                    src={chatPartner.avatarUrl}
                    alt={`${chatPartner.username}'s avatar`}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {chatPartner.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <span
                  className={`absolute bottom-0 right-0 block w-3 h-3 rounded-full border-2 border-white ${
                    isConnecting ? "bg-yellow-400" : "bg-green-500"
                  }`}
                />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{chatPartner.username}</h3>
                {isTyping && (
                  <p className="text-sm text-gray-500">typing...</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 text-center">
            <h3 className="font-semibold text-gray-900">Select a Conversation</h3>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        <div className="h-[calc(100vh-16rem)] overflow-y-auto bg-gray-50 p-4">
          {isConnecting ? (
            <div className="flex flex-col items-center justify-center h-full space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <p className="text-sm text-gray-500">Connecting to chat...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupMessagesByDate(messages)).map(([date, dateMessages]) => (
                <div key={date} className="space-y-4">
                  <div className="flex justify-center">
                    <span className="px-3 py-1 text-xs text-gray-500 bg-white rounded-full shadow-sm">
                      {date}
                    </span>
                  </div>
                  {dateMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.senderId === senderId ? "justify-end" : "justify-start"
                      } items-end`}
                    >
                      {msg.senderId !== senderId && chatPartner?.avatarUrl && (
                        <img
                          src={chatPartner.avatarUrl}
                          alt={`${chatPartner.username}'s avatar`}
                          className="w-8 h-8 rounded-full object-cover mr-2"
                        />
                      )}
                      <div className="flex flex-col space-y-1 max-w-[75%]">
                        <div
                          className={`rounded-2xl px-4 py-2 shadow-sm ${
                            msg.senderId === senderId
                              ? "bg-blue-600 text-white rounded-br-none"
                              : "bg-white text-gray-900 rounded-bl-none"
                          }`}
                        >
                          {renderMessageContent(msg.text)}
                          {msg.fileUrl && renderFilePreview(msg)}
                        </div>
                        <div
                          className={`flex items-center space-x-2 ${
                            msg.senderId === senderId ? "justify-end" : "justify-start"
                          }`}
                        >
                          <span className="text-xs text-gray-500">
                            {formatTime(msg.timestamp)}
                          </span>
                          {msg.senderId === senderId && renderMessageStatus(msg)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </CardContent>

      {chatPartner && (
        <CardFooter className="p-4 bg-white border-t">
          {selectedFile && (
            <div className="flex items-center bg-gray-100 p-2 mb-2 rounded-md w-full">
              <div className="flex-1 truncate text-sm">{selectedFile.name}</div>
              <button 
                onClick={handleRemoveFile} 
                className="ml-2 text-gray-500 hover:text-gray-700"
              >
                <X size={16} />
              </button>
            </div>
          )}
          <div className="flex w-full items-end space-x-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,application/pdf,text/*,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            />
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-gray-500 hover:text-gray-600"
              onClick={() => fileInputRef.current?.click()}
              disabled={isConnecting || isUploading}
            >
              <PaperClipIcon className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <Input
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTyping();
                }}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Type a message..."
                className="rounded-full bg-gray-100 border-0 focus:ring-2 focus:ring-blue-500"
                disabled={isConnecting || isUploading}
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={(!newMessage.trim() && !selectedFile) || isConnecting || isUploading}
              size="icon"
              className="rounded-full bg-blue-600 hover:bg-blue-700"
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default Chat;
