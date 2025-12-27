"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  MessageCircle,
  Send,
  Paperclip,
  Phone,
  Video,
  MoreHorizontal,
  Clock,
  Check,
  CheckCheck,
  AlertCircle,
  Bot,
  User,
  Calendar,
  Home,
  Search,
  Plus
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"

interface Message {
  _id: string
  bookingId: string
  senderId: string
  recipientId: string
  senderType: 'guest' | 'admin' | 'property_owner'
  recipientType: 'guest' | 'admin' | 'property_owner'
  content: string
  subject?: string
  messageType: 'text' | 'image' | 'file' | 'system' | 'auto_response'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'sent' | 'delivered' | 'read' | 'archived'
  isSystemGenerated: boolean
  createdAt: string
  senderId_populated?: { name: string; email: string }
  recipientId_populated?: { name: string; email: string }
  bookingId_populated?: { 
    bookingCode: string
    propertyId: { title: string }
  }
}

interface Conversation {
  _id: string
  lastMessage: Message
  unreadCount: number
  totalMessages: number
}

interface GuestMessagingProps {
  bookingId?: string
  recipientId?: string
  recipientType?: 'guest' | 'admin' | 'property_owner'
  compact?: boolean
}

export default function GuestMessaging({ 
  bookingId, 
  recipientId, 
  recipientType,
  compact = false 
}: GuestMessagingProps) {
  const { data: session } = useSession()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [newMessageSubject, setNewMessageSubject] = useState("")
  const [messagePriority, setMessagePriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [showNewMessageDialog, setShowNewMessageDialog] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (session?.user) {
      loadConversations()
    }
  }, [session])

  useEffect(() => {
    if (selectedConversation) {
      loadMessages()
    }
  }, [selectedConversation])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Auto-select conversation if bookingId and recipientId are provided
  useEffect(() => {
    if (bookingId && recipientId && conversations.length > 0) {
      const conversationId = `${bookingId}_${[session?.user?.id, recipientId].sort().join('_')}`
      setSelectedConversation(conversationId)
    }
  }, [bookingId, recipientId, conversations])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const loadConversations = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/messages?conversations=true')
      
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations || [])
        
        if (data.conversations?.length > 0 && !selectedConversation) {
          setSelectedConversation(data.conversations[0]._id)
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async () => {
    if (!selectedConversation) return

    try {
      setLoading(true)
      
      // Extract booking ID and other user ID from thread ID
      const [bookingPart, usersPart] = selectedConversation.split('_')
      const userIds = usersPart.split('_')
      const otherUserId = userIds.find(id => id !== session?.user?.id)
      
      const response = await fetch(
        `/api/messages?bookingId=${bookingPart}&conversationWith=${otherUserId}`
      )
      
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
        
        // Mark messages as read
        const unreadMessageIds = data.messages
          ?.filter((msg: Message) => 
            msg.recipientId === session?.user?.id && 
            ['sent', 'delivered'].includes(msg.status)
          )
          .map((msg: Message) => msg._id)
        
        if (unreadMessageIds?.length > 0) {
          markMessagesAsRead(unreadMessageIds)
        }
      }
    } catch (error) {
      // Silent failure for loading messages
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !recipientId || !bookingId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    try {
      setSending(true)
      
      const messageData = {
        bookingId,
        recipientId,
        recipientType: recipientType || 'admin',
        content: newMessage.trim(),
        subject: newMessageSubject.trim() || undefined,
        priority: messagePriority,
        messageType: 'text'
      }

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData)
      })

      if (response.ok) {
        const sentMessage = await response.json()
        setMessages(prev => [...prev, sentMessage])
        setNewMessage("")
        setNewMessageSubject("")
        setShowNewMessageDialog(false)
        
        toast({
          title: "Message Sent",
          description: "Your message has been sent successfully",
        })
        
        // Refresh conversations to update last message
        loadConversations()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send message')
      }
    } catch (error: any) {
      toast({
        title: "Send Error",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setSending(false)
    }
  }

  const markMessagesAsRead = async (messageIds: string[]) => {
    try {
      await fetch('/api/messages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageIds,
          action: 'mark_read'
        })
      })
      
      // Update local state
      setMessages(prev => 
        prev.map(msg => 
          messageIds.includes(msg._id) ? { ...msg, status: 'read' } : msg
        )
      )
      
      // Update conversation unread count
      setConversations(prev =>
        prev.map(conv =>
          conv._id === selectedConversation
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      )
    } catch (error) {
      // Silent failure for marking as read
    }
  }

  const getMessageIcon = (message: Message) => {
    if (message.isSystemGenerated) {
      return <Bot className="h-4 w-4" />
    }
    return <User className="h-4 w-4" />
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Check className="h-3 w-3 text-gray-400" />
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-gray-400" />
      case 'read':
        return <CheckCheck className="h-3 w-3 text-blue-500" />
      default:
        return <Clock className="h-3 w-3 text-gray-400" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 border-l-red-500'
      case 'high': return 'bg-orange-100 border-l-orange-500'
      case 'medium': return 'bg-blue-100 border-l-blue-500'
      case 'low': return 'bg-gray-100 border-l-gray-500'
      default: return 'bg-gray-100 border-l-gray-500'
    }
  }

  const isCurrentUser = (message: Message) => {
    return message.senderId === session?.user?.id
  }

  const filteredConversations = conversations.filter(conv =>
    !searchTerm || 
    conv.lastMessage.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.lastMessage.bookingId_populated?.bookingCode?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!session?.user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Please sign in to access messaging</p>
        </CardContent>
      </Card>
    )
  }

  // Compact view for booking details page
  if (compact) {
    return (
      <Dialog open={showNewMessageDialog} onOpenChange={setShowNewMessageDialog}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <MessageCircle className="h-4 w-4 mr-2" />
            Send Message
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Message</DialogTitle>
            <DialogDescription>
              Send a message about this booking
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Subject (Optional)</Label>
              <Input
                placeholder="Message subject..."
                value={newMessageSubject}
                onChange={(e) => setNewMessageSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={messagePriority} onValueChange={(value: any) => setMessagePriority(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={sendMessage} disabled={sending || !newMessage.trim()}>
              {sending ? (
                "Sending..."
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <div className="h-[600px] border rounded-lg overflow-hidden">
      <div className="flex h-full">
        {/* Conversations Sidebar */}
        <div className="w-1/3 border-r bg-gray-50">
          <div className="p-4 border-b bg-white">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Messages</h3>
              <Button size="sm" variant="outline" onClick={() => setShowNewMessageDialog(true)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          
          <ScrollArea className="h-[calc(100%-120px)]">
            {loading ? (
              <div className="p-4">
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No conversations yet</p>
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation._id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedConversation === conversation._id
                        ? 'bg-blue-100 border border-blue-200'
                        : 'hover:bg-white'
                    }`}
                    onClick={() => setSelectedConversation(conversation._id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {conversation.lastMessage.bookingId_populated?.bookingCode}
                          </span>
                          {conversation.unreadCount > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mb-1">
                          {conversation.lastMessage.bookingId_populated?.propertyId?.title}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {conversation.lastMessage.content}
                        </p>
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Messages Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Message Header */}
              <div className="p-4 border-b bg-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">
                      {conversations.find(c => c._id === selectedConversation)?.lastMessage.bookingId_populated?.bookingCode}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {conversations.find(c => c._id === selectedConversation)?.lastMessage.bookingId_populated?.propertyId?.title}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Video className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message._id}
                      className={`flex ${isCurrentUser(message) ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg border-l-4 ${
                          isCurrentUser(message)
                            ? 'bg-blue-500 text-white border-l-blue-700'
                            : getPriorityColor(message.priority)
                        }`}
                      >
                        {message.subject && (
                          <p className="font-semibold text-sm mb-2">{message.subject}</p>
                        )}
                        <p className="text-sm">{message.content}</p>
                        <div className={`flex items-center justify-between mt-2 text-xs ${
                          isCurrentUser(message) ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          <div className="flex items-center gap-1">
                            {getMessageIcon(message)}
                            <span>{formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}</span>
                          </div>
                          {isCurrentUser(message) && getStatusIcon(message.status)}
                        </div>
                        {message.priority !== 'medium' && (
                          <Badge 
                            variant={message.priority === 'urgent' ? 'destructive' : 'secondary'}
                            className="mt-2 text-xs"
                          >
                            {message.priority}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div ref={messagesEndRef} />
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t bg-white">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Textarea
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      rows={2}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          sendMessage()
                        }
                      }}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button variant="ghost" size="sm">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button 
                      onClick={sendMessage} 
                      disabled={sending || !newMessage.trim()}
                      size="sm"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center">
              <div>
                <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">Select a Conversation</h3>
                <p className="text-gray-500">Choose a conversation from the sidebar to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}