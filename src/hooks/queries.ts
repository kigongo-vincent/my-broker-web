import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GET, POST, encodeCreatePost, CreatePostInput } from '../api/http';
import { useUserStore } from '../store/auth';

/**
 * Example of fetching properties (posts) with pagination and filters.
 */
export function useGetProperties(controls: Parameters<typeof GET>[1] = { limit: 10, page: 1 }) {
  return useQuery({
    queryKey: ['properties', controls],
    queryFn: async () => {
      const response = await GET('/posts', controls);
      if (response.status >= 400) {
        throw new Error(response.msg || 'Failed to fetch properties');
      }
      return response;
    },
  });
}

/**
 * Example of fetching the current user's profile.
 */
export function useGetProfile() {
  const user = useUserStore(state => state.user) as any;
  
  return useQuery({
    queryKey: ['profile', user?.ID],
    queryFn: async () => {
      if (!user?.ID) throw new Error('Not authenticated');
      const response = await GET(`/users/${user.ID}`);
      if (response.status >= 400) {
        throw new Error(response.msg || 'Failed to fetch profile');
      }
      return response;
    },
    enabled: !!user?.ID, // Only run if authenticated
  });
}

/**
 * Example of uploading a new property.
 */
export function useUploadProperty() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: CreatePostInput) => {
      const bytes = encodeCreatePost(input);
      const response = await POST('posts', bytes);
      if (response.status >= 400) {
        throw new Error(response.msg || 'Failed to upload property');
      }
      return response;
    },
    onSuccess: () => {
      // Invalidate the properties list so it refreshes after upload
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });
}

export function useGetChats() {
  const user = useUserStore(state => state.user) as any;
  return useQuery({
    queryKey: ['chats', user?.ID],
    queryFn: async () => {
      if (!user?.ID) throw new Error('Not authenticated');
      const response = await GET('/chat');
      if (response.status >= 400) {
        throw new Error(response.msg || 'Failed to fetch chats');
      }
      return response;
    },
    enabled: !!user?.ID,
  });
}

export function useGetPostDetails(id: number | string) {
  return useQuery({
    queryKey: ['post', id],
    queryFn: async () => {
      if (!id) throw new Error('No ID provided');
      const response = await GET(`/posts/${id}`);
      if (response.status >= 400) {
        throw new Error(response.msg || 'Failed to fetch post details');
      }
      return response;
    },
    enabled: !!id,
  });
}

export function useGetFavourites() {
  const user = useUserStore(state => state.user) as any;
  return useQuery({
    queryKey: ['favourites', user?.ID],
    queryFn: async () => {
      if (!user?.ID) throw new Error('Not authenticated');
      // Using a typical params structure for fetching favourites
      const response = await GET('/posts', { type: 'favourites' });
      if (response.status >= 400) {
        throw new Error(response.msg || 'Failed to fetch favourites');
      }
      return response;
    },
    enabled: !!user?.ID,
  });
}

export function useSearchProperties(query: string, controls: Parameters<typeof GET>[1] = { limit: 10, page: 1 }) {
  return useQuery({
    queryKey: ['searchProperties', query, controls],
    queryFn: async () => {
      const response = await GET('/posts', { ...controls, query });
      if (response.status >= 400) {
        throw new Error(response.msg || 'Failed to search properties');
      }
      return response;
    },
    enabled: !!query,
  });
}
