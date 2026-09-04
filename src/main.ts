import App from './app.vue'
import { installBugLogger } from './components/00.shared/lib/bugLogger'
import router from './components/00.shared/lib/router'
import { initTheme } from './components/00.shared/lib/theme'
import { setupBackButton } from './components/06.app/backButton'
import { setupPWA } from './components/06.app/pwa'
import websocketPlugin from './components/06.app/websocket'
import { withI18n } from './components/06.app/withI18n'
import './generated/icons'
import './assets/scss/index.scss'

installBugLogger()

initTheme()

const app = createApp(App)

withI18n(app)
app.use(createPinia())
app.use(router)
app.use(websocketPlugin)

app.mount('#app')

setupPWA()
setupBackButton()
