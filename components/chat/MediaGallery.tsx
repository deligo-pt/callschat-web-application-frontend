import React, { useEffect, useState } from "react";
import { chatService } from "@/services/chat.service";
import { groupService } from "@/services/group.service";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, FileIcon, ImageIcon, Music, Play, ExternalLink } from "lucide-react";
import { VoiceMessagePlayer } from "./VoiceMessagePlayer";

interface MediaItem {
  id: string;
  mediaUrl: string;
  mediaType: string;
  createdAt: string;
}

interface MediaGalleryProps {
  conversationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isGroup?: boolean;
}

export function MediaGallery({ conversationId, open, onOpenChange, isGroup }: MediaGalleryProps) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (!open) return;
    
    const fetchMedia = async () => {
      setLoading(true);
      try {
        let res;
        if (isGroup) {
          res = await groupService.fetchGroupMedia(conversationId, page);
        } else {
          res = await chatService.fetchConversationMedia(conversationId, page);
        }
        
        if (res.success && res.data) {
          if (page === 1) {
            setItems(res.data.media);
          } else {
            setItems(prev => [...prev, ...res.data.media]);
          }
          if (res.data.media.length < res.data.limit) {
            setHasMore(false);
          }
        }
      } catch (err) {
        console.error("Failed to fetch media gallery", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMedia();
  }, [conversationId, open, page, isGroup]);

  const imagesAndVideos = items.filter(
    m => m.mediaType.startsWith("image/") || m.mediaType.startsWith("video/") || m.mediaType === "image" || m.mediaType === "video" || m.mediaType === "emoji"
  );
  
  const filesAndVoice = items.filter(
    m => m.mediaType.startsWith("audio/") || m.mediaType === "audio" || (!m.mediaType.startsWith("image/") && !m.mediaType.startsWith("video/") && m.mediaType !== "image" && m.mediaType !== "video" && m.mediaType !== "emoji")
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px] p-0 flex flex-col bg-white">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle className="text-xl font-bold text-[#111928]">Media, Files and Voice</SheetTitle>
        </SheetHeader>
        
        <Tabs defaultValue="media" className="flex-1 flex flex-col h-full overflow-hidden">
          <div className="px-6 pt-4 pb-2 border-b">
            <TabsList className="w-full grid grid-cols-2 bg-[#F3F4F6] p-1 rounded-xl">
              <TabsTrigger value="media" className="rounded-lg font-medium text-[14px] data-[state=active]:bg-white data-[state=active]:text-[#3B58F5] data-[state=active]:shadow-sm transition-all">
                Media
              </TabsTrigger>
              <TabsTrigger value="files" className="rounded-lg font-medium text-[14px] data-[state=active]:bg-white data-[state=active]:text-[#3B58F5] data-[state=active]:shadow-sm transition-all">
                Files & Voice
              </TabsTrigger>
            </TabsList>
          </div>
          
          <ScrollArea className="flex-1">
            <TabsContent value="media" className="p-6 m-0 border-none outline-none">
              {loading && page === 1 ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin text-[#3B58F5]" />
                </div>
              ) : imagesAndVideos.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center p-12 text-[#6B7280]">
                  <ImageIcon className="w-12 h-12 mb-4 opacity-20" />
                  <p>No media shared yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {imagesAndVideos.map((item) => (
                    <a 
                      key={item.id} 
                      href={item.mediaUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="relative aspect-square rounded-xl overflow-hidden group bg-[#F3F4F6]"
                    >
                      {item.mediaType.includes('video') ? (
                        <>
                          <video 
                            src={item.mediaUrl} 
                            className="w-full h-full object-cover" 
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <Play className="w-8 h-8 text-white opacity-80" fill="currentColor" />
                          </div>
                        </>
                      ) : (
                        <img 
                          src={item.mediaUrl} 
                          alt="Media" 
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                        />
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                        <ExternalLink className="w-6 h-6 text-white" />
                      </div>
                    </a>
                  ))}
                  {hasMore && !loading && (
                    <button 
                      onClick={() => setPage(p => p + 1)}
                      className="aspect-square rounded-xl flex flex-col items-center justify-center bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#3B58F5] transition-colors"
                    >
                      <span className="text-sm font-medium">Load more</span>
                    </button>
                  )}
                  {loading && page > 1 && (
                    <div className="aspect-square flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-[#3B58F5]" />
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="files" className="p-6 m-0 border-none outline-none">
              {loading && page === 1 ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin text-[#3B58F5]" />
                </div>
              ) : filesAndVoice.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center p-12 text-[#6B7280]">
                  <Music className="w-12 h-12 mb-4 opacity-20" />
                  <p>No files or voice notes shared yet</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {filesAndVoice.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-[#E5E7EB]/50 transition-shadow hover:shadow-md">
                      {item.mediaType.includes('audio') || item.mediaType === 'audio' ? (
                        <div className="flex-1 min-w-0 flex items-center gap-3">
                          <div className="w-10 h-10 shrink-0 rounded-full bg-[#3B58F5]/10 flex items-center justify-center">
                            <Music className="w-5 h-5 text-[#3B58F5]" />
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium text-[#111928] truncate mb-2">
                              Voice Note
                            </p>
                            <VoiceMessagePlayer src={item.mediaUrl} messageId={item.id} isMe={false} />
                          </div>
                          <div className="text-xs text-[#6B7280] whitespace-nowrap self-start pt-1">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      ) : (
                        <a 
                          href={item.mediaUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex-1 min-w-0 flex items-center gap-3 group"
                        >
                          <div className="w-10 h-10 shrink-0 rounded-xl bg-[#F3F4F6] group-hover:bg-[#3B58F5]/10 flex items-center justify-center transition-colors">
                            <FileIcon className="w-5 h-5 text-[#6B7280] group-hover:text-[#3B58F5] transition-colors" />
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium text-[#111928] truncate group-hover:text-[#3B58F5] transition-colors">
                              {item.mediaUrl.split('/').pop() || "Document"}
                            </p>
                            <p className="text-xs text-[#6B7280]">
                              {new Date(item.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </a>
                      )}
                    </div>
                  ))}
                  {hasMore && !loading && (
                    <button 
                      onClick={() => setPage(p => p + 1)}
                      className="w-full py-3 rounded-xl bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#3B58F5] font-medium transition-colors mt-2"
                    >
                      Load more
                    </button>
                  )}
                  {loading && page > 1 && (
                    <div className="flex justify-center p-4">
                      <Loader2 className="w-6 h-6 animate-spin text-[#3B58F5]" />
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
