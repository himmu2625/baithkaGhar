"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Instagram, 
  Youtube, 
  Facebook, 
  Twitter, 
  ExternalLink, 
  Users, 
  Heart, 
  MessageCircle,
  Share2,
  TrendingUp,
  Calendar,
  Eye,
  Star,
  Link
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AnimatedCounter } from './animated-counter';
import { cn } from '@/lib/utils';

interface SocialMediaAccount {
  platform: 'instagram' | 'youtube' | 'facebook' | 'twitter';
  username: string;
  followers: number;
  engagement: number;
  verified: boolean;
  profileUrl: string;
  avatar?: string;
  lastPost?: {
    date: string;
    likes: number;
    comments: number;
    shares: number;
  };
}

interface SocialMediaStats {
  totalFollowers: number;
  avgEngagement: number;
  totalPosts: number;
  reachThisMonth: number;
}

const PLATFORM_COLORS = {
  instagram: 'from-pink-500 to-purple-600',
  youtube: 'from-red-500 to-red-600',
  facebook: 'from-blue-600 to-blue-700',
  twitter: 'from-blue-400 to-blue-500',
};

const PLATFORM_ICONS = {
  instagram: Instagram,
  youtube: Youtube,
  facebook: Facebook,
  twitter: Twitter,
};

// Social Media Profile Card
export function SocialMediaCard({ 
  account, 
  className = '',
  showStats = true,
}: { 
  account: SocialMediaAccount; 
  className?: string;
  showStats?: boolean;
}) {
  const Icon = PLATFORM_ICONS[account.platform];
  const gradient = PLATFORM_COLORS[account.platform];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className={className}
    >
      <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/90 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-3 rounded-xl bg-gradient-to-r ${gradient} shadow-lg`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 flex items-center">
                  @{account.username}
                  {account.verified && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      Verified
                    </Badge>
                  )}
                </h3>
                <p className="text-sm text-gray-600 capitalize">{account.platform}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href={account.profileUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          </div>
        </CardHeader>
        
        {showStats && (
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <AnimatedCounter 
                  end={account.followers} 
                  className="text-lg font-bold text-gray-900"
                />
                <p className="text-xs text-gray-600">Followers</p>
              </div>
              <div className="text-center">
                <AnimatedCounter 
                  end={account.engagement} 
                  suffix="%" 
                  decimals={1}
                  className="text-lg font-bold text-gray-900"
                />
                <p className="text-xs text-gray-600">Engagement</p>
              </div>
            </div>

            {account.lastPost && (
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>Last Post</span>
                  <span>{account.lastPost.date}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <div className="flex items-center space-x-1">
                    <Heart className="w-3 h-3 text-red-500" />
                    <span>{account.lastPost.likes.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageCircle className="w-3 h-3 text-blue-500" />
                    <span>{account.lastPost.comments}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Share2 className="w-3 h-3 text-green-500" />
                    <span>{account.lastPost.shares}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </motion.div>
  );
}

// Social Media Stats Overview
export function SocialMediaOverview({ 
  stats,
  accounts,
  className = '',
}: {
  stats: SocialMediaStats;
  accounts: SocialMediaAccount[];
  className?: string;
}) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <AnimatedCounter 
              end={stats.totalFollowers} 
              className="text-2xl font-bold text-gray-900"
            />
            <p className="text-xs text-gray-600">Total Followers</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <AnimatedCounter 
              end={stats.avgEngagement} 
              suffix="%" 
              decimals={1}
              className="text-2xl font-bold text-gray-900"
            />
            <p className="text-xs text-gray-600">Avg Engagement</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
          <CardContent className="p-4 text-center">
            <Calendar className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <AnimatedCounter 
              end={stats.totalPosts} 
              className="text-2xl font-bold text-gray-900"
            />
            <p className="text-xs text-gray-600">Total Posts</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
          <CardContent className="p-4 text-center">
            <Eye className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <AnimatedCounter 
              end={stats.reachThisMonth} 
              className="text-2xl font-bold text-gray-900"
            />
            <p className="text-xs text-gray-600">Monthly Reach</p>
          </CardContent>
        </Card>
      </div>

      {/* Platform Breakdown */}
      <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Platform Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {accounts.map((account, index) => {
            const Icon = PLATFORM_ICONS[account.platform];
            const gradient = PLATFORM_COLORS[account.platform];
            const percentage = (account.followers / stats.totalFollowers) * 100;

            return (
              <motion.div
                key={account.platform}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center space-x-4"
              >
                <div className={`p-2 rounded-lg bg-gradient-to-r ${gradient}`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {account.platform}
                    </span>
                    <span className="text-sm text-gray-600">
                      {account.followers.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      className={`h-2 rounded-full bg-gradient-to-r ${gradient}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 1, delay: index * 0.2 }}
                    />
                  </div>
                </div>
                <span className="text-xs text-gray-500">
                  {percentage.toFixed(1)}%
                </span>
              </motion.div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

// Add Social Media Account Form
export function AddSocialMediaForm({
  onAdd,
  className = '',
}: {
  onAdd: (account: Omit<SocialMediaAccount, 'followers' | 'engagement' | 'verified'>) => void;
  className?: string;
}) {
  const [platform, setPlatform] = useState<SocialMediaAccount['platform']>('instagram');
  const [username, setUsername] = useState('');
  const [profileUrl, setProfileUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !profileUrl) return;

    onAdd({
      platform,
      username,
      profileUrl,
    });

    setUsername('');
    setProfileUrl('');
  };

  return (
    <Card className={cn("border-0 shadow-lg bg-white/90 backdrop-blur-sm", className)}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Add Social Media Account</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Platform
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['instagram', 'youtube', 'facebook', 'twitter'] as const).map((p) => {
                const Icon = PLATFORM_ICONS[p];
                const gradient = PLATFORM_COLORS[p];
                
                return (
                  <motion.button
                    key={p}
                    type="button"
                    onClick={() => setPlatform(p)}
                    className={cn(
                      "p-3 rounded-lg border-2 transition-all duration-200 flex items-center justify-center space-x-2",
                      platform === p
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className={`p-1 rounded bg-gradient-to-r ${gradient}`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium capitalize">{p}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Username
            </label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username (without @)"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Profile URL
            </label>
            <Input
              value={profileUrl}
              onChange={(e) => setProfileUrl(e.target.value)}
              placeholder="https://..."
              type="url"
              required
            />
          </div>

          <Button type="submit" className="w-full">
            <Link className="w-4 h-4 mr-2" />
            Connect Account
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// Influencer Social Media Dashboard
export function InfluencerSocialDashboard({
  accounts,
  stats,
  onAddAccount,
  className = '',
}: {
  accounts: SocialMediaAccount[];
  stats: SocialMediaStats;
  onAddAccount: (account: Omit<SocialMediaAccount, 'followers' | 'engagement' | 'verified'>) => void;
  className?: string;
}) {
  return (
    <div className={cn("space-y-8", className)}>
      {/* Overview Stats */}
      <SocialMediaOverview stats={stats} accounts={accounts} />

      {/* Connected Accounts */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Connected Accounts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((account) => (
            <SocialMediaCard
              key={`${account.platform}-${account.username}`}
              account={account}
            />
          ))}
        </div>
      </div>

      {/* Add New Account */}
      <AddSocialMediaForm onAdd={onAddAccount} />

      {/* Performance Insights */}
      <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center">
            <Star className="w-5 h-5 mr-2 text-yellow-500" />
            Performance Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">+12.5%</p>
              <p className="text-sm text-gray-600">Follower Growth</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Heart className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600">4.2%</p>
              <p className="text-sm text-gray-600">Avg Engagement Rate</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Eye className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-600">2.1M</p>
              <p className="text-sm text-gray-600">Total Reach</p>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Star className="w-5 h-5 text-yellow-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800">Optimization Tip</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Your Instagram engagement is 23% above average! Consider posting more 
                  reels and stories to capitalize on this momentum.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}