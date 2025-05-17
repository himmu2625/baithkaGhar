"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, MessageSquare, Search, Filter, Send, ChevronDown, ArrowUpDown, User, Clock, CheckCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  recipientId: string;
  recipientName: string;
  recipientAvatar?: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  isAdmin: boolean;
}

interface Conversation {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  propertyId?: string;
  propertyName?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  status: "active" | "archived" | "resolved";
}

export default function AdminMessagesPage() {
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState("all");

  // Mock conversation data
  const mockConversations: Conversation[] = [
    {
      id: "CONV-001",
      userId: "USER-1234",
      userName: "John Doe",
      userAvatar: "/avatars/john-doe.jpg",
      propertyId: "PROP-1234",
      propertyName: "Mountain View Villa",
      lastMessage: "Thank you for your prompt response. I've made the payment.",
      lastMessageTime: "2023-06-15T14:30:00",
      unreadCount: 2,
      status: "active",
    },
    {
      id: "CONV-002",
      userId: "USER-1235",
      userName: "Jane Smith",
      propertyId: "PROP-1235",
      propertyName: "Lakeside Cottage",
      lastMessage: "Is early check-in possible on Friday?",
      lastMessageTime: "2023-06-14T09:15:00",
      unreadCount: 0,
      status: "active",
    },
    {
      id: "CONV-003",
      userId: "USER-1236",
      userName: "Mike Johnson",
      userAvatar: "/avatars/mike-johnson.jpg",
      propertyId: "PROP-1236",
      propertyName: "Urban Apartment",
      lastMessage: "I've reported the issue with the water heater.",
      lastMessageTime: "2023-06-13T18:45:00",
      unreadCount: 1,
      status: "active",
    },
    {
      id: "CONV-004",
      userId: "USER-1237",
      userName: "Sarah Williams",
      propertyId: "PROP-1237",
      propertyName: "Beach House",
      lastMessage: "Thank you for resolving my issue so quickly!",
      lastMessageTime: "2023-06-10T11:20:00",
      unreadCount: 0,
      status: "resolved",
    },
    {
      id: "CONV-005",
      userId: "USER-1238",
      userName: "Robert Brown",
      userAvatar: "/avatars/robert-brown.jpg",
      propertyId: "PROP-1238",
      propertyName: "Forest Cabin",
      lastMessage: "I need to cancel my reservation due to an emergency.",
      lastMessageTime: "2023-06-08T16:05:00",
      unreadCount: 0,
      status: "archived",
    },
  ];

  // Mock messages for a conversation
  const mockMessages: Record<string, Message[]> = {
    "CONV-001": [
      {
        id: "MSG-001",
        conversationId: "CONV-001",
        senderId: "USER-1234",
        senderName: "John Doe",
        senderAvatar: "/avatars/john-doe.jpg",
        recipientId: "ADMIN-001",
        recipientName: "Admin",
        content: "Hello, I'm interested in booking the Mountain View Villa for next weekend. Is it available?",
        timestamp: "2023-06-14T10:00:00",
        isRead: true,
        isAdmin: false,
      },
      {
        id: "MSG-002",
        conversationId: "CONV-001",
        senderId: "ADMIN-001",
        senderName: "Admin",
        recipientId: "USER-1234",
        recipientName: "John Doe",
        recipientAvatar: "/avatars/john-doe.jpg",
        content: "Hi John, yes the Mountain View Villa is available for next weekend. Would you like to proceed with a booking?",
        timestamp: "2023-06-14T10:15:00",
        isRead: true,
        isAdmin: true,
      },
      {
        id: "MSG-003",
        conversationId: "CONV-001",
        senderId: "USER-1234",
        senderName: "John Doe",
        senderAvatar: "/avatars/john-doe.jpg",
        recipientId: "ADMIN-001",
        recipientName: "Admin",
        content: "Great! Yes, I'd like to book it from Friday to Sunday. How do I proceed with payment?",
        timestamp: "2023-06-14T10:30:00",
        isRead: true,
        isAdmin: false,
      },
      {
        id: "MSG-004",
        conversationId: "CONV-001",
        senderId: "ADMIN-001",
        senderName: "Admin",
        recipientId: "USER-1234",
        recipientName: "John Doe",
        recipientAvatar: "/avatars/john-doe.jpg",
        content: "I've sent you a payment link via email. Once you complete the payment, your booking will be confirmed.",
        timestamp: "2023-06-14T11:00:00",
        isRead: true,
        isAdmin: true,
      },
      {
        id: "MSG-005",
        conversationId: "CONV-001",
        senderId: "USER-1234",
        senderName: "John Doe",
        senderAvatar: "/avatars/john-doe.jpg",
        recipientId: "ADMIN-001",
        recipientName: "Admin",
        content: "Thank you for your prompt response. I've made the payment.",
        timestamp: "2023-06-15T14:30:00",
        isRead: false,
        isAdmin: false,
      },
    ],
    "CONV-002": [
      {
        id: "MSG-006",
        conversationId: "CONV-002",
        senderId: "USER-1235",
        senderName: "Jane Smith",
        recipientId: "ADMIN-001",
        recipientName: "Admin",
        content: "Hi, I've booked the Lakeside Cottage for this weekend. I was wondering if early check-in is possible on Friday?",
        timestamp: "2023-06-14T09:15:00",
        isRead: true,
        isAdmin: false,
      },
    ],
    "CONV-003": [
      {
        id: "MSG-007",
        conversationId: "CONV-003",
        senderId: "USER-1236",
        senderName: "Mike Johnson",
        senderAvatar: "/avatars/mike-johnson.jpg",
        recipientId: "ADMIN-001",
        recipientName: "Admin",
        content: "Hello, there seems to be an issue with the water heater in the Urban Apartment.",
        timestamp: "2023-06-13T18:30:00",
        isRead: true,
        isAdmin: false,
      },
      {
        id: "MSG-008",
        conversationId: "CONV-003",
        senderId: "ADMIN-001",
        senderName: "Admin",
        recipientId: "USER-1236",
        recipientName: "Mike Johnson",
        recipientAvatar: "/avatars/mike-johnson.jpg",
        content: "I'm sorry to hear that. Could you please provide more details about the issue?",
        timestamp: "2023-06-13T18:40:00",
        isRead: true,
        isAdmin: true,
      },
      {
        id: "MSG-009",
        conversationId: "CONV-003",
        senderId: "USER-1236",
        senderName: "Mike Johnson",
        senderAvatar: "/avatars/mike-johnson.jpg",
        recipientId: "ADMIN-001",
        recipientName: "Admin",
        content: "I've reported the issue with the water heater.",
        timestamp: "2023-06-13T18:45:00",
        isRead: false,
        isAdmin: false,
      },
    ],
  };

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setConversations(mockConversations);
      setFilteredConversations(mockConversations);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Filter conversations based on search query, status filter and tab
  useEffect(() => {
    let result = [...conversations];

    // Apply tab filter
    if (activeTab === "unread") {
      result = result.filter(conv => conv.unreadCount > 0);
    } else if (activeTab !== "all") {
      result = result.filter(conv => conv.status === activeTab);
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (conversation) =>
          conversation.userName.toLowerCase().includes(query) ||
          (conversation.propertyName && conversation.propertyName.toLowerCase().includes(query)) ||
          conversation.lastMessage.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter((conversation) => conversation.status === statusFilter);
    }

    setFilteredConversations(result);
  }, [searchQuery, statusFilter, conversations, activeTab]);

  // Load messages when a conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      const conversationMessages = mockMessages[selectedConversation.id] || [];
      setMessages(conversationMessages);

      // Mark messages as read
      if (selectedConversation.unreadCount > 0) {
        const updatedConversations = conversations.map(conv => 
          conv.id === selectedConversation.id 
            ? { ...conv, unreadCount: 0 } 
            : conv
        );
        setConversations(updatedConversations);
        setFilteredConversations(
          filteredConversations.map(conv => 
            conv.id === selectedConversation.id 
              ? { ...conv, unreadCount: 0 } 
              : conv
          )
        );
      }
    }
  }, [selectedConversation]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const newMsg: Message = {
      id: `MSG-${Date.now()}`,
      conversationId: selectedConversation.id,
      senderId: "ADMIN-001",
      senderName: "Admin",
      recipientId: selectedConversation.userId,
      recipientName: selectedConversation.userName,
      recipientAvatar: selectedConversation.userAvatar,
      content: newMessage,
      timestamp: new Date().toISOString(),
      isRead: true,
      isAdmin: true,
    };

    // Add message to conversation
    setMessages([...messages, newMsg]);

    // Update last message in conversations
    const updatedConversations = conversations.map(conv => 
      conv.id === selectedConversation.id 
        ? { 
            ...conv, 
            lastMessage: newMessage,
            lastMessageTime: new Date().toISOString(),
          } 
        : conv
    );
    setConversations(updatedConversations);
    setFilteredConversations(
      filteredConversations.map(conv => 
        conv.id === selectedConversation.id 
          ? { 
              ...conv, 
              lastMessage: newMessage,
              lastMessageTime: new Date().toISOString(),
            } 
          : conv
      )
    );

    setNewMessage("");
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return format(date, "h:mm a");
    } else {
      return format(date, "MMM d, h:mm a");
    }
  };

  const updateConversationStatus = (conversationId: string, newStatus: Conversation['status']) => {
    const updatedConversations = conversations.map(conv => 
      conv.id === conversationId 
        ? { ...conv, status: newStatus } 
        : conv
    );
    setConversations(updatedConversations);
    setFilteredConversations(
      filteredConversations.map(conv => 
        conv.id === conversationId 
          ? { ...conv, status: newStatus } 
          : conv
      )
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "resolved":
        return "bg-blue-100 text-blue-800";
      case "archived":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6 mt-12"> 
    <div className="flex justify-between items-center">
      <h1 className="text-3xl font-bold flex items-center">Message Management</h1>
    </div>
       

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-darkGreen" />
          <span className="ml-2">Loading message data...</span>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Total Conversations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{conversations.length}</div>
                <p className="text-xs text-gray-500 mt-1">
                  All conversations
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Active Conversations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {conversations.filter(c => c.status === "active").length}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Ongoing discussions
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Unread Messages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {conversations.reduce((sum, conv) => sum + conv.unreadCount, 0)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Awaiting response
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Messaging Interface */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3 h-[600px]">
              {/* Conversations List */}
              <div className="border-r">
                <div className="p-4 border-b">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Search conversations..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="border-b">
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="w-full grid grid-cols-4">
                      <TabsTrigger value="all">All</TabsTrigger>
                      <TabsTrigger value="active">Active</TabsTrigger>
                      <TabsTrigger value="unread">Unread</TabsTrigger>
                      <TabsTrigger value="resolved">Resolved</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <ScrollArea className="h-[490px]">
                  {filteredConversations.length > 0 ? (
                    filteredConversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${
                          selectedConversation?.id === conversation.id ? "bg-gray-100" : ""
                        }`}
                        onClick={() => setSelectedConversation(conversation)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center">
                            <Avatar className="h-8 w-8 mr-2">
                              <AvatarImage src={conversation.userAvatar} />
                              <AvatarFallback>
                                {conversation.userName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{conversation.userName}</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(conversation.lastMessageTime).toLocaleDateString()}
                          </div>
                        </div>
                        
                        {conversation.propertyName && (
                          <div className="text-xs text-gray-500 mb-1">
                            Re: {conversation.propertyName}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <p className="text-sm truncate max-w-[180px]">
                            {conversation.lastMessage}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <Badge className="bg-red-500 text-white">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center mt-2">
                          <Badge
                            variant="outline"
                            className={getStatusColor(conversation.status)}
                          >
                            {conversation.status.charAt(0).toUpperCase() + conversation.status.slice(1)}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      No conversations found
                    </div>
                  )}
                </ScrollArea>
              </div>

              {/* Messages Area */}
              <div className="col-span-2 flex flex-col h-full">
                {selectedConversation ? (
                  <>
                    {/* Conversation Header */}
                    <div className="p-4 border-b flex items-center justify-between">
                      <div className="flex items-center">
                        <Avatar className="h-10 w-10 mr-3">
                          <AvatarImage src={selectedConversation.userAvatar} />
                          <AvatarFallback>
                            {selectedConversation.userName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">{selectedConversation.userName}</h3>
                          {selectedConversation.propertyName && (
                            <p className="text-xs text-gray-500">
                              Re: {selectedConversation.propertyName}
                            </p>
                          )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {selectedConversation.status !== "resolved" && (
                            <DropdownMenuItem 
                              onClick={() => updateConversationStatus(selectedConversation.id, "resolved")}
                            >
                              Mark as resolved
                            </DropdownMenuItem>
                          )}
                          {selectedConversation.status !== "active" && (
                            <DropdownMenuItem 
                              onClick={() => updateConversationStatus(selectedConversation.id, "active")}
                            >
                              Mark as active
                            </DropdownMenuItem>
                          )}
                          {selectedConversation.status !== "archived" && (
                            <DropdownMenuItem 
                              onClick={() => updateConversationStatus(selectedConversation.id, "archived")}
                            >
                              Archive conversation
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Messages */}
                    <ScrollArea className="flex-1 p-4">
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${
                              message.isAdmin ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[70%] rounded-lg p-3 ${
                                message.isAdmin
                                  ? "bg-darkGreen text-white"
                                  : "bg-gray-100"
                              }`}
                            >
                              <div className="flex items-center mb-1">
                                {!message.isAdmin && (
                                  <Avatar className="h-6 w-6 mr-2">
                                    <AvatarImage src={message.senderAvatar} />
                                    <AvatarFallback>
                                      {message.senderName.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                                <span className={`text-xs ${message.isAdmin ? "text-gray-200" : "text-gray-500"}`}>
                                  {message.isAdmin ? "You" : message.senderName}
                                </span>
                              </div>
                              <p className="text-sm">{message.content}</p>
                              <div className="flex items-center justify-end mt-1">
                                <span className={`text-xs ${message.isAdmin ? "text-gray-200" : "text-gray-500"}`}>
                                  {formatMessageTime(message.timestamp)}
                                </span>
                                {message.isAdmin && (
                                  <CheckCheck className="h-3 w-3 ml-1 text-gray-200" />
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>

                    {/* Message Input */}
                    <div className="p-4 border-t">
                      <div className="flex">
                        <Textarea
                          placeholder="Type your message..."
                          className="resize-none mr-2"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                        />
                        <Button onClick={handleSendMessage}>
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <MessageSquare className="h-16 w-16 mb-4 text-gray-300" />
                    <h3 className="text-xl font-medium mb-2">No conversation selected</h3>
                    <p>Select a conversation from the list to view messages</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 