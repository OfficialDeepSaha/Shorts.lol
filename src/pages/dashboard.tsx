import { TOKEN_LIMITS, VIDEOS_TABLE, VideoTable } from '@/constants';
import { useRouter } from 'next/router';
import React, { useCallback, useEffect, useState } from 'react';
import { FiPlus } from 'react-icons/fi';

import { getVideosByUserId } from '@/lib/supabase/videos/getVideosByUserId';
import { supabase } from '@/lib/supabaseClient';

import { VideoError } from '@/components/cards/VideoError';
import { VideoLoading } from '@/components/cards/VideoLoading';
import { VideoPreview } from '@/components/cards/VideoPreview';
import DashboardHeader, { NAV_ITEMS } from '@/components/headers/dashboardHeader';
import Layout from '@/components/layout/Layout';
import Loader from '@/components/Loader';
import Seo from '@/components/Seo';

import { useUser } from '@/contexts/UserContexts';
import { useVideos } from '@/contexts/videosContext';
import withAuth from '@/hoc/withAuth';
import toast from 'react-hot-toast';

const HomePage = () => {
  const { user } = useUser(); // Ensure `user` is available
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const { videos, addVideo, updateVideo, setVideos } = useVideos();

  // Set up a subscription to listen for updates on the videos table
  useEffect(() => {
    const channel = supabase
      .channel('steps')
      .on(
        'postgres_changes',
        {
          schema: 'public',
          table: VIDEOS_TABLE,
          event: 'UPDATE',
        },
        (payload) => {
          const newVideo = payload.new as VideoTable;

          const videoExists = videos.some((video) => video.id === newVideo.id);

          if (videoExists) {
            updateVideo(newVideo);
          } else {
            addVideo(newVideo);
          }
        }
      )
      .subscribe();

    // Clean up subscription on component unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [videos, addVideo, updateVideo]);

  // Fetch videos from Supabase based on the user's ID
  const getVideos = useCallback(async () => {
    if (!user) return;

    try {
      const fetchedVideos = await getVideosByUserId(user.id);
      setVideos(fetchedVideos);
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast.error('Failed to fetch videos. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [setVideos, user]);

  // Call getVideos when the component mounts
  useEffect(() => {
    getVideos();
  }, [getVideos]);

  // Button to create a new video
  const createNewButton = (
    <button
      onClick={() => {
        if (user && user.free_credits_used > TOKEN_LIMITS.FREE && !user.subscription) {
          router.push('/pricing');
        } else {
          router.push('/create');
        }
      }}
      className='group relative inline-flex w-fit items-center justify-center overflow-hidden rounded-md p-1 font-bold'
    >
      <span className='absolute h-full w-full bg-gradient-to-br from-[#ff8a05] via-[#ff5478] to-[#ff00c6] group-hover:from-[#ff00c6] group-hover:via-[#ff5478] group-hover:to-[#ff8a05]'></span>
      <span className='duration-400 relative flex w-full items-center gap-x-2 rounded-md bg-gray-900 px-6 py-3 transition-all ease-out group-hover:bg-opacity-0'>
        <span className='relative hidden text-white sm:block'>
          Create new video
        </span>
        <span className='relative text-white sm:hidden'>New video</span>
        <FiPlus className='h-6 w-6 text-white' />
      </span>
    </button>
  );

  return (
    <Layout>
      <DashboardHeader activeElement={NAV_ITEMS.DASHBOARD} />
      <Seo />
      <div className='mx-auto max-w-7xl px-2 sm:px-6 lg:px-8'>
        {loading ? (
          <div className='flex h-[80vh] items-center justify-center gap-x-2'>
            <Loader />
          </div>
        ) : videos.length === 0 ? (
          <div className='flex h-[80vh] items-center justify-center'>
            <div className='flex flex-col items-center gap-y-2 sm:gap-y-4'>
              <h2>Welcome to shorts.lol 🎉</h2>
              {createNewButton}
            </div>
          </div>
        ) : (
          <div>
            <div className='mt-4 flex w-full flex-col items-center gap-y-4 sm:mt-6'>
              <div className='flex w-full items-center justify-between'>
                <h3 className='text-gray-700'>My videos</h3>
                {createNewButton}
              </div>
              <div className='grid w-full grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4'>
                {videos.map((video) => (
                  <div key={video.id}>
                    <div className='h-full rounded-xl shadow-lg'>
                      {video.error_message ? (
                        <VideoError video={video} />
                      ) : !video.url ? (
                        <VideoLoading video={video} />
                      ) : (
                        <VideoPreview video={video} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default withAuth(HomePage);
