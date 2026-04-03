export interface Profile {
  id: string
  username: string
  display_name: string
  avatar_letter: string
  avatar_color: string
  avatar_url: string | null
  banner_url: string | null
  bio: string
  verified: boolean
  followers_count: number
  following_count: number
  posts_count: number
  created_at: string
}

export interface Post {
  id: string
  author_id: string
  content: string
  media_emoji: string | null
  media_url: string | null
  chatroom_tag: string | null
  likes_count: number
  comments_count: number
  reposts_count: number
  created_at: string
  profiles?: Profile
  liked_by_user?: boolean
}

export interface Comment {
  id: string
  post_id: string
  author_id: string
  content: string
  created_at: string
  profiles?: Profile
}

export interface Chatroom {
  id: string
  name: string
  description: string
  icon: string
  color: string
  topic: string
  members_count: number
  is_live: boolean
  created_by: string | null
  created_at: string
}

export interface ChatroomMessage {
  id: string
  room_id: string
  author_id: string
  content: string
  created_at: string
  profiles?: Profile
}

export interface Conversation {
  id: string
  user1_id: string
  user2_id: string
  last_message: string
  last_message_at: string
  user1_unread: number
  user2_unread: number
  created_at: string
  other_user?: Profile
}

export interface DirectMessage {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
  profiles?: Profile
}

export interface Artwork {
  id: string
  artist_id: string
  title: string
  description: string
  emoji: string
  gradient: string
  price_usd: number
  category: string
  likes_count: number
  is_sold: boolean
  created_at: string
  profiles?: Profile
  liked_by_user?: boolean
}

export interface NewsArticle {
  id: string
  title: string
  category: string
  source: string
  emoji: string
  preview: string
  url: string
  image_url: string | null
  is_featured: boolean
  published_at: string
}

export interface SavedItem {
  id: string
  user_id: string
  item_type: 'post' | 'artwork' | 'news'
  item_id: string
  created_at: string
}
