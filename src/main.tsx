import "./hooks/install" // registers beforeinstallprompt early, before React renders
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router'
import { initThemeColor } from './utils/theme.tsx'
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { queryPersister } from "./store/cache.ts";
const DAY = 1000 * 60 * 60 * 24;
initThemeColor()

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister: queryPersister,
          maxAge: DAY,
          buster: "v1", // bump this whenever the post shape changes
          dehydrateOptions: {
            // only the home/search feed is saved, not the map, chats or anything else
            shouldDehydrateQuery: (q) =>
              q.state.status === "success" &&
              q.queryKey[0] === "posts" &&
              q.queryKey[1] === "infinite",
          },
        }}
      >

        <App />
      </PersistQueryClientProvider>

    </BrowserRouter>
  </QueryClientProvider>
)