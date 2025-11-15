'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, Send, MessageSquare, Lock, Users } from 'lucide-react'

const generateEphemeralId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let id = ''
  for (let i = 0; i < 5; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return id
}

export default function SecretChatLite() {
  const [userId, setUserId] = useState('')
  const [posts, setPosts] = useState([])
  const [replies, setReplies] = useState({})
  const [message, setMessage] = useState('')
  const [replyTexts, setReplyTexts] = useState({})
  const [searchId, setSearchId] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [loading, setLoading] = useState(true)
  
  // Private messaging state
  const [privateMessages, setPrivateMessages] = useState([])
  const [privateTargetId, setPrivateTargetId] = useState('')
  const [privateMessageText, setPrivateMessageText] = useState('')
  const [selectedConversation, setSelectedConversation] = useState(null)
  
  const userIdRef = useRef('')

  // Generate ephemeral ID on mount
  useEffect(() => {
    const newId = generateEphemeralId()
    setUserId(newId)
    userIdRef.current = newId
    console.log('Generated ephemeral ID:', newId)
  }, [])

  // Fetch initial posts and replies
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch posts
        const { data: postsData, error: postsError } = await supabase
          .from('public_posts')
          .select('*')
          .order('created_at', { ascending: false })

        if (postsError) throw postsError
        setPosts(postsData || [])

        // Fetch replies
        const { data: repliesData, error: repliesError } = await supabase
          .from('post_replies')
          .select('*')
          .order('created_at', { ascending: true })

        if (repliesError) throw repliesError

        // Group replies by post_id
        const repliesMap = {}
        repliesData?.forEach(reply => {
          if (!repliesMap[reply.post_id]) {
            repliesMap[reply.post_id] = []
          }
          repliesMap[reply.post_id].push(reply)
        })
        setReplies(repliesMap)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching data:', error)
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Fetch private messages
  useEffect(() => {
    if (!userId) return

    const fetchPrivateMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('private_messages')
          .select('*')
          .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
          .order('created_at', { ascending: true })

        if (error) throw error
        setPrivateMessages(data || [])
      } catch (error) {
        console.error('Error fetching private messages:', error)
      }
    }

    fetchPrivateMessages()
  }, [userId])

  // Subscribe to real-time updates
  useEffect(() => {
    // Subscribe to posts
    const postsChannel = supabase
      .channel('public_posts_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'public_posts' },
        (payload) => {
          console.log('New post:', payload.new)
          setPosts(prev => [payload.new, ...prev])
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'public_posts' },
        (payload) => {
          console.log('Post deleted:', payload.old)
          setPosts(prev => prev.filter(post => post.id !== payload.old.id))
        }
      )
      .subscribe()

    // Subscribe to replies
    const repliesChannel = supabase
      .channel('post_replies_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'post_replies' },
        (payload) => {
          console.log('New reply:', payload.new)
          setReplies(prev => ({
            ...prev,
            [payload.new.post_id]: [...(prev[payload.new.post_id] || []), payload.new]
          }))
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'post_replies' },
        (payload) => {
          console.log('Reply deleted:', payload.old)
          setReplies(prev => {
            const updated = { ...prev }
            if (updated[payload.old.post_id]) {
              updated[payload.old.post_id] = updated[payload.old.post_id].filter(
                reply => reply.id !== payload.old.id
              )
            }
            return updated
          })
        }
      )
      .subscribe()

    // Subscribe to private messages
    const privateChannel = supabase
      .channel('private_messages_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'private_messages' },
        (payload) => {
          console.log('New private message:', payload.new)
          // Only add if it involves current user
          if (payload.new.from_user_id === userId || payload.new.to_user_id === userId) {
            setPrivateMessages(prev => [...prev, payload.new])
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'private_messages' },
        (payload) => {
          console.log('Private message deleted:', payload.old)
          setPrivateMessages(prev => prev.filter(msg => msg.id !== payload.old.id))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(postsChannel)
      supabase.removeChannel(repliesChannel)
      supabase.removeChannel(privateChannel)
    }
  }, [userId])

  // Cleanup messages on page unload
  useEffect(() => {
    const handleBeforeUnload = async () => {
      const currentUserId = userIdRef.current
      if (currentUserId) {
        // Delete user's posts, replies, and private messages
        await supabase.from('public_posts').delete().eq('user_id', currentUserId)
        await supabase.from('post_replies').delete().eq('user_id', currentUserId)
        await supabase.from('private_messages').delete().or(`from_user_id.eq.${currentUserId},to_user_id.eq.${currentUserId}`)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  const handlePostMessage = async () => {
    if (!message.trim()) return

    try {
      const { error } = await supabase
        .from('public_posts')
        .insert([{ user_id: userId, message: message.trim() }])

      if (error) throw error
      setMessage('')
    } catch (error) {
      console.error('Error posting message:', error)
      alert('Failed to post message')
    }
  }

  const handleReply = async (postId) => {
    const replyText = replyTexts[postId]?.trim()
    if (!replyText) return

    try {
      const { error } = await supabase
        .from('post_replies')
        .insert([{ post_id: postId, user_id: userId, reply: replyText }])

      if (error) throw error
      setReplyTexts(prev => ({ ...prev, [postId]: '' }))
    } catch (error) {
      console.error('Error posting reply:', error)
      alert('Failed to post reply')
    }
  }

  const handleSendPrivateMessage = async () => {
    const targetId = selectedConversation || privateTargetId.trim().toUpperCase()
    if (!targetId || !privateMessageText.trim()) return

    if (targetId === userId) {
      alert('You cannot message yourself!')
      return
    }

    try {
      const { error } = await supabase
        .from('private_messages')
        .insert([{ 
          from_user_id: userId, 
          to_user_id: targetId, 
          message: privateMessageText.trim() 
        }])

      if (error) throw error
      setPrivateMessageText('')
      setPrivateTargetId('')
      setSelectedConversation(targetId)
    } catch (error) {
      console.error('Error sending private message:', error)
      alert('Failed to send private message')
    }
  }

  const handleSearch = async () => {
    if (!searchId.trim()) {
      setIsSearching(false)
      return
    }
    setIsSearching(true)
  }

  const clearSearch = () => {
    setSearchId('')
    setIsSearching(false)
  }

  const filteredPosts = isSearching
    ? posts.filter(post => post.user_id === searchId.trim().toUpperCase())
    : posts

  // Get unique conversation partners
  const conversations = {}
  privateMessages.forEach(msg => {
    const partnerId = msg.from_user_id === userId ? msg.to_user_id : msg.from_user_id
    if (!conversations[partnerId]) {
      conversations[partnerId] = []
    }
    conversations[partnerId].push(msg)
  })

  const conversationList = Object.keys(conversations)

  // Get messages for selected conversation
  const selectedMessages = selectedConversation
    ? (conversations[selectedConversation] || [])
    : []

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Secret Chat Lite</h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>Your ID:</span>
            <span className="text-primary font-mono text-lg font-bold">{userId}</span>
          </div>
        </div>

        {/* Tabs for Public and Private */}
        <Tabs defaultValue="public" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="public" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Public Wall
            </TabsTrigger>
            <TabsTrigger value="private" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Private Messages
              {conversationList.length > 0 && (
                <span className="ml-1 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                  {conversationList.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* PUBLIC WALL TAB */}
          <TabsContent value="public" className="space-y-6">
            {/* Post Message */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg">Post a Message</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="Anyone free to chat?"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handlePostMessage()}
                    className="flex-1"
                  />
                  <Button onClick={handlePostMessage} size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Search */}
            <Card className="border-border">
              <CardContent className="pt-6">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search by ID (e.g., E4D9X)"
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value.toUpperCase())}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="flex-1"
                  />
                  <Button onClick={handleSearch} variant="secondary" size="icon">
                    <Search className="h-4 w-4" />
                  </Button>
                  {isSearching && (
                    <Button onClick={clearSearch} variant="outline">
                      Clear
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Public Posts */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Public Messages
                {isSearching && (
                  <span className="text-sm text-muted-foreground font-normal">
                    (showing posts by {searchId})
                  </span>
                )}
              </h2>

              {filteredPosts.length === 0 ? (
                <Card className="border-border">
                  <CardContent className="py-8 text-center text-muted-foreground">
                    {isSearching ? 'No posts found for this ID' : 'No messages yet. Be the first to post!'}
                  </CardContent>
                </Card>
              ) : (
                filteredPosts.map(post => (
                  <Card key={post.id} className="border-border">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-primary">{post.user_id}</span>
                          {post.user_id === userId && (
                            <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">You</span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">{formatTime(post.created_at)}</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-4">{post.message}</p>

                      {/* Replies */}
                      {replies[post.id] && replies[post.id].length > 0 && (
                        <div className="space-y-2 mb-4 pl-4 border-l-2 border-border">
                          {replies[post.id].map(reply => (
                            <div key={reply.id} className="bg-muted/50 p-3 rounded">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-sm font-semibold text-primary">
                                    {reply.user_id}
                                  </span>
                                  {reply.user_id === userId && (
                                    <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">You</span>
                                  )}
                                </div>
                                <span className="text-xs text-muted-foreground">{formatTime(reply.created_at)}</span>
                              </div>
                              <p className="text-sm">{reply.reply}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Reply Input */}
                      <div className="flex gap-2">
                        <Input
                          placeholder="Reply..."
                          value={replyTexts[post.id] || ''}
                          onChange={(e) => setReplyTexts(prev => ({ ...prev, [post.id]: e.target.value }))}
                          onKeyPress={(e) => e.key === 'Enter' && handleReply(post.id)}
                          className="flex-1"
                        />
                        <Button onClick={() => handleReply(post.id)} size="sm" variant="secondary">
                          Reply
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* PRIVATE MESSAGES TAB */}
          <TabsContent value="private" className="space-y-6">
            {/* Start New Conversation */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg">Send Private Message</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Input
                    placeholder="Enter user ID (e.g., E4D9X)"
                    value={privateTargetId}
                    onChange={(e) => setPrivateTargetId(e.target.value.toUpperCase())}
                    disabled={!!selectedConversation}
                  />
                  {selectedConversation && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Chatting with: <span className="font-mono font-bold text-primary">{selectedConversation}</span>
                      </span>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setSelectedConversation(null)
                          setPrivateTargetId('')
                        }}
                      >
                        New Chat
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Conversations List */}
              <div className="lg:col-span-1">
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="text-sm">Conversations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {conversationList.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No conversations yet
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {conversationList.map(partnerId => (
                          <Button
                            key={partnerId}
                            variant={selectedConversation === partnerId ? "default" : "outline"}
                            className="w-full justify-start font-mono"
                            onClick={() => setSelectedConversation(partnerId)}
                          >
                            <Lock className="h-3 w-3 mr-2" />
                            {partnerId}
                          </Button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Message Thread */}
              <div className="lg:col-span-2">
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="text-sm">
                      {selectedConversation ? `Chat with ${selectedConversation}` : 'Select a conversation'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Messages Display */}
                    <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                      {selectedMessages.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          {selectedConversation ? 'No messages yet. Start the conversation!' : 'Select a conversation to view messages'}
                        </p>
                      ) : (
                        selectedMessages.map(msg => {
                          const isSent = msg.from_user_id === userId
                          return (
                            <div
                              key={msg.id}
                              className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[70%] rounded-lg p-3 ${
                                  isSent
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted'
                                }`}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-mono font-semibold">
                                    {isSent ? 'You' : msg.from_user_id}
                                  </span>
                                  <span className="text-xs opacity-70">{formatTime(msg.created_at)}</span>
                                </div>
                                <p className="text-sm">{msg.message}</p>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>

                    {/* Message Input */}
                    <div className="flex gap-2">
                      <Input
                        placeholder={selectedConversation ? "Type a message..." : "Enter ID above to start"}
                        value={privateMessageText}
                        onChange={(e) => setPrivateMessageText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendPrivateMessage()}
                        disabled={!selectedConversation && !privateTargetId.trim()}
                        className="flex-1"
                      />
                      <Button 
                        onClick={handleSendPrivateMessage} 
                        size="icon"
                        disabled={!selectedConversation && !privateTargetId.trim()}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}