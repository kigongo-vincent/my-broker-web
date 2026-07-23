
import { useEffect, useRef } from "react"
import AppRouter from "./routes/Index"
import { useAppStore } from "./store/app"
import { BottomSheet, BottomSheetRef } from 'react-spring-bottom-sheet'
import 'react-spring-bottom-sheet/dist/style.css'
import SmoothScrollProvider from "./utils/scroll"
import { useLocation, useNavigate } from "react-router"
import Modal from "./components/base/Modal"
import { useQuery } from "@tanstack/react-query"
import { Get } from "../api"
import { useUserStore } from "./store/auth"
import Lineicons from "@lineiconshq/react-lineicons"
import { CloudCheckCircleSolid } from "@lineiconshq/free-icons"
export const RModal = () => {
  const { RootBottomContent, setRootBottomContent } = useAppStore()
  const sheetRef = useRef<BottomSheetRef | null>(null)
  const navigate = useNavigate()
  return (
    <BottomSheet open={Boolean(RootBottomContent?.title)} onDismiss={() => setRootBottomContent(undefined)} ref={sheetRef} className="z-000">
      <div className="py-10 px-4 min-h-[26vh] flex justify-around  flex-col gap-4">
        <h3 className="text-xl font-semibold">{RootBottomContent?.title}</h3>
        <p className="text-text/60 leading-7">{RootBottomContent?.body}</p>
        <button onClick={() => { setRootBottomContent(undefined); navigate("/auth") }} className="btn bg-primary w-full rounded-full">{RootBottomContent?.action?.title}</button>
      </div>
    </BottomSheet>
  )
}

const App = () => {
  const { pathname } = useLocation()
  const { error, setFavouritesCount, setError, success, setSuccess } = useAppStore()
  const { token } = useUserStore()

  // This forces the page to jump to the top left instantly on every route change
  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant'
    })
  }, [pathname])

  const { data } = useQuery({
    queryKey: ["favourites-count"],
    queryFn: () => token == "" ? null : Get<{ count: number }>("posts/favourites")
  })

  useEffect(() => {
    setFavouritesCount(data?.data?.count || 0)
  }, [])



  return (
    <>
      <SmoothScrollProvider>
        <AppRouter />
      </SmoothScrollProvider>
      {/* root modal  */}
      <RModal />

      {/* error modal  */}
      <Modal actions={<button onClick={() => setError({ body: "" })} className="btn bg-pale">ok</button>} open={Boolean(error?.body)} onClose={() => setError({ body: "" })}>
        <h3 className="text-xl font-semibold text-danger">{error?.title || "Error"}</h3>
        <p className="text-text/70">{error?.body}</p>
      </Modal>

      {/* success modal  */}
      <Modal actions={<button onClick={() => setSuccess({ body: "" })} className="btn bg-primary">ok</button>} open={Boolean(success?.body)} onClose={() => setSuccess({ body: "" })}>

        <div className="flex items-center gap-1 text-success">
          <Lineicons icon={CloudCheckCircleSolid} />
          <h3 className="text-xl font-semibold text-success">{success?.title || "success"}</h3>
        </div>

        <p className="text-text/70 mt-2">{success?.body}</p>
      </Modal>
    </>
  )
}

export default App