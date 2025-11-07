import React, { useEffect, useRef, useState } from "react";
import Peer from "peerjs";
import {
  Send,
  Copy,
  Check,
  Link,
  MessageCircle,
  Wifi,
  WifiOff,
  CheckCheck,
} from "lucide-react";

const PeerChat = () => {
  const [myId, setMyId] = useState("");
  const [friendId, setFriendId] = useState("");
  const [msg, setMsg] = useState("");
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [friendTyping, setFriendTyping] = useState(false);
  const peerRef = useRef(null);
  const connectionRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, friendTyping]);

  useEffect(() => {
    const peer = new Peer();
    peerRef.current = peer;

    peer.on("open", function (id) {
      setMyId(id);
    });

    peer.on("connection", function (conn) {
      connectionRef.current = conn;
      setIsConnected(true);

      conn.on("data", function (data) {
        if (data.type === "message") {
          const newMessage = {
            id: data.id,
            text: data.text,
            sender: "friend",
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            seen: false,
          };
          setMessages((prev) => [...prev, newMessage]);

          // Send seen receipt
          setTimeout(() => {
            conn.send({ type: "seen", messageId: data.id });
          }, 500);
        } else if (data.type === "typing") {
          setFriendTyping(data.isTyping);
        } else if (data.type === "seen") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === data.messageId ? { ...m, seen: true } : m
            )
          );
        }
      });

      conn.on("close", function () {
        setIsConnected(false);
        setFriendTyping(false);
      });
    });

    return () => {
      peer.destroy();
    };
  }, []);

  const connectHandle = () => {
    if (!friendId.trim()) return;

    const connection = peerRef.current.connect(friendId);
    connectionRef.current = connection;

    connection.on("open", () => {
      setIsConnected(true);
    });

    connection.on("data", function (data) {
      if (data.type === "message") {
        const newMessage = {
          id: data.id,
          text: data.text,
          sender: "friend",
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          seen: false,
        };
        setMessages((prev) => [...prev, newMessage]);

        // Send seen receipt
        setTimeout(() => {
          connection.send({ type: "seen", messageId: data.id });
        }, 500);
      } else if (data.type === "typing") {
        setFriendTyping(data.isTyping);
      } else if (data.type === "seen") {
        setMessages((prev) =>
          prev.map((m) => (m.id === data.messageId ? { ...m, seen: true } : m))
        );
      }
    });

    connection.on("close", function () {
      setIsConnected(false);
      setFriendTyping(false);
    });
  };

  const handleSend = () => {
    if (!msg.trim() || !connectionRef.current) return;

    const messageId = Date.now().toString();
    const message = msg;

    connectionRef.current.send({
      type: "message",
      id: messageId,
      text: message,
    });

    setMessages((prev) => [
      ...prev,
      {
        id: messageId,
        text: message,
        sender: "you",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        seen: false,
      },
    ]);
    setMsg("");

    // Stop typing indicator
    if (isTyping) {
      connectionRef.current.send({ type: "typing", isTyping: false });
      setIsTyping(false);
    }
  };

  const handleTyping = (e) => {
    setMsg(e.target.value);

    if (!connectionRef.current) return;

    // Send typing indicator
    if (!isTyping && e.target.value.length > 0) {
      setIsTyping(true);
      connectionRef.current.send({ type: "typing", isTyping: true });
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (connectionRef.current) {
        connectionRef.current.send({ type: "typing", isTyping: false });
      }
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (isConnected) {
        handleSend();
      } else {
        connectHandle();
      }
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(myId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 flex items-center justify-center">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageCircle className="text-white" size={32} />
              <div>
                <h1 className="text-2xl font-bold text-white">P2P Chat</h1>
                <p className="text-indigo-100 text-sm">
                  {friendTyping ? "Typing..." : "Peer-to-peer messaging"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isConnected ? (
                <div className="flex items-center gap-2 bg-green-500 px-4 py-2 rounded-full">
                  <Wifi size={16} className="text-white" />
                  <span className="text-white text-sm font-medium">
                    Connected
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                  <WifiOff size={16} className="text-white" />
                  <span className="text-white text-sm font-medium">
                    Offline
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Connection Section */}
        <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
          <div className="space-y-4">
            {/* Your ID */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Your ID
              </label>
              <div className="flex gap-2">
                <div className="flex-1 bg-white border-2 border-indigo-200 rounded-xl px-4 py-3 font-mono text-sm text-gray-800 overflow-x-auto">
                  {myId ? (
                    myId
                  ) : (
                    <span className="text-gray-400">Generating ID...</span>
                  )}
                </div>
                <button
                  onClick={copyToClipboard}
                  disabled={!myId}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white px-4 rounded-xl transition-all duration-200 flex items-center gap-2 min-w-fit"
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            {/* Friend ID */}
            {!isConnected && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Friend's ID
                </label>
                <div className="flex gap-2">
                  <input
                    value={friendId}
                    onChange={(e) => setFriendId(e.target.value)}
                    onKeyPress={handleKeyPress}
                    type="text"
                    placeholder="Enter friend's ID to connect"
                    className="flex-1 bg-white border-2 border-purple-200 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                  <button
                    onClick={connectHandle}
                    disabled={!friendId.trim()}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-300 disabled:to-gray-300 text-white px-6 rounded-xl transition-all duration-200 flex items-center gap-2 font-semibold min-w-fit"
                  >
                    <Link size={18} />
                    Connect
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="h-96 overflow-y-auto p-6 bg-gray-50">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <MessageCircle
                  size={64}
                  className="text-gray-300 mx-auto mb-4"
                />
                <p className="text-gray-400 text-lg font-medium">
                  No messages yet
                </p>
                <p className="text-gray-300 text-sm mt-2">
                  {isConnected
                    ? "Start chatting!"
                    : "Connect with a friend to start messaging"}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.sender === "you" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                      message.sender === "you"
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-sm"
                        : "bg-white text-gray-800 rounded-bl-sm border border-gray-200"
                    }`}
                  >
                    <p className="text-sm leading-relaxed break-words">
                      {message.text}
                    </p>
                    <div className="flex items-center justify-between mt-1 gap-2">
                      <p
                        className={`text-xs ${
                          message.sender === "you"
                            ? "text-indigo-200"
                            : "text-gray-400"
                        }`}
                      >
                        {message.time}
                      </p>
                      {message.sender === "you" && (
                        <div className="flex items-center">
                          {message.seen ? (
                            <CheckCheck size={11} className="text-blue-300" />
                          ) : (
                            <Check size={11} className="text-indigo-200" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {friendTyping && (
                <div className="flex justify-start">
                  <div className="bg-white text-gray-800 rounded-2xl rounded-bl-sm border border-gray-200 px-4 py-3 shadow-sm">
                    <div className="flex gap-1">
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t">
          <div className="flex gap-2">
            <input
              value={msg}
              onChange={handleTyping}
              onKeyPress={handleKeyPress}
              type="text"
              placeholder={
                isConnected
                  ? "Type a message..."
                  : "Connect first to send messages"
              }
              disabled={!isConnected}
              className="flex-1 bg-gray-100 border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all disabled:bg-gray-50 disabled:text-gray-400"
            />
            <button
              onClick={handleSend}
              disabled={!msg.trim() || !isConnected}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-300 text-white px-6 rounded-xl transition-all duration-200 flex items-center gap-2 font-semibold"
            >
              <Send size={18} />
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PeerChat;
