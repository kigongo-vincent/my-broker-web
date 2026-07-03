
import AppRouter from "./routes/Index"
import SmoothScrollProvider from "./utils/scroll"
const App = () => {
  return (
    <SmoothScrollProvider>
      <AppRouter />
    </SmoothScrollProvider>
  )
}

export default App